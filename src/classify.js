'use strict';

// Turns a raw agent hook payload (Claude Code format) into a small,
// agent-agnostic signal the game understands. Adapters for other agents
// only need to produce the same signal kinds.

const path = require('node:path');

// A command line is split into the commands it runs (a && b; c | d), with
// quoted text removed, so `git commit -m "make npm test pass"` runs no
// tests. Each command is then matched from its start, past what usually
// comes before the tool: VAR=1, sudo, npx, pnpm exec, uv run, ./ and so on.
const RUNNER_PREFIX = /^(?:\w+=\S*\s+)*(?:sudo\s+)?(?:(?:npx|bunx|pnpx)\s+|(?:pnpm|yarn)\s+(?:exec|dlx)\s+|(?:uv|poetry|pipenv|bundle)\s+(?:run|exec)\s+)?(?:\.\/)?/i;

function commandsIn(line) {
  return String(line)
    .replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""')
    .split(/&&|\|\||[;|\n]/)
    .map((part) => part.trim().replace(RUNNER_PREFIX, ''))
    .filter(Boolean);
}

const anchored = (parts) => new RegExp(`^(?:${parts.join('|')})`, 'i');

const TEST_COMMAND = anchored(
  [
    String.raw`\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b`,
    String.raw`\b(npx\s+)?(jest|vitest|mocha|ava|playwright\s+test|cypress\s+run)\b`,
    String.raw`\bpytest\b`,
    String.raw`\bpython3?\s+-m\s+(pytest|unittest)\b`,
    String.raw`\b(tox|nox)\b`,
    String.raw`\bgo\s+test\b`,
    String.raw`\bcargo\s+(test|nextest)\b`,
    String.raw`\bdotnet\s+test\b`,
    String.raw`\bdeno\s+test\b`,
    String.raw`\bnode\s+--test\b`,
    String.raw`\bmix\s+test\b`,
    String.raw`\b(rspec|phpunit|ctest)\b`,
    String.raw`\bmvnw?\b.*\b(test|verify)\b`,
    String.raw`\bgradlew?\b.*\b(test|check)\b`,
    String.raw`\bmake\s+(test|check)\b`,
  ],
);

// Order matters: a summary like "1 failed, 12 passed" is a failure.
// FAIL only counts at the start of a line (jest, go, pytest, unittest), so a
// test named "should FAIL gracefully" does not turn a green run red.
const FAIL_MARKERS = [
  /\b[1-9]\d*\s+(failed|failing|failures?|errors?)\b/i,
  /\b(failures?|errors?|failed):\s*[1-9]/i,
  /^\s*(--- )?FAIL(ED)?\b/m,
  /^\s*Failed!\s/m,
  /\bBUILD FAIL(URE|ED)\b/,
  /Traceback \(most recent call last\)/,
  /\bnpm (ERR!|error)/,
  /\bexit(ed)?( with)? code:?\s*[1-9]/i,
  /\btest result: FAILED/,
  /^not ok\b/m,
  /^# fail [1-9]/m,
];

const PASS_MARKERS = [
  /\b[1-9]\d*\s+(passed|passing|tests? passed)\b/i,
  /\bPASS\b/,
  /\btest result: ok\b/,
  /^ok\s+\S+/m,
  /^OK( \(|$)/m,
  /\ball tests passed\b/i,
  /^# pass [1-9]/m,
  /^\s*Passed!\s/m,
  /\bBUILD SUCCESS(FUL)?\b/,
];

const MAX_OUTPUT = 20000;

function isTestCommand(command) {
  return typeof command === 'string' && commandsIn(command).some((c) => TEST_COMMAND.test(c));
}

// Builds, linters and type checks: not a riichi, but their result is worth
// a glance. The exit code decides (PostToolUse = 0, PostToolUseFailure = not).
const CHECK_COMMANDS = {
  types: [
    String.raw`\b(npx\s+)?tsc\b`,
    String.raw`\b(npm|pnpm|yarn|bun)\s+(run\s+)?(typecheck|type-check|tsc|check-types)\b`,
    String.raw`\b(mypy|pyright)\b`,
    String.raw`\bcargo\s+check\b`,
  ],
  lint: [
    String.raw`\b(npx\s+)?(eslint|biome\s+(check|lint)|prettier\s+(--check|-c))\b`,
    String.raw`\b(npm|pnpm|yarn|bun)\s+(run\s+)?lint\b`,
    String.raw`\b(ruff\s+check|ruff|flake8|pylint|rubocop|golangci-lint)\b`,
    String.raw`\bcargo\s+clippy\b`,
    String.raw`\bgo\s+vet\b`,
  ],
  build: [
    String.raw`\b(npm|pnpm|yarn|bun)\s+(run\s+)?build\b`,
    String.raw`\b(cargo|go|dotnet)\s+build\b`,
    String.raw`\bmvnw?\b.*\b(package|compile|install)\b`,
    String.raw`\bgradlew?\b.*\b(build|assemble)\b`,
    String.raw`\b(npx\s+)?(vite|next|webpack)\s+build\b`,
    String.raw`\bmake\s+build\b`,
  ],
};
const CHECKS = Object.entries(CHECK_COMMANDS).map(([type, parts]) => [type, anchored(parts)]);

// 'types' | 'lint' | 'build', or null.
function checkKind(command) {
  if (typeof command !== 'string' || isTestCommand(command)) return null;
  const commands = commandsIn(command);
  for (const [type, re] of CHECKS) if (commands.some((c) => re.test(c))) return type;
  return null;
}

function withCheck(signal, payload, passed) {
  const type = payload.tool_name === 'Bash' ? checkKind(payload.tool_input && payload.tool_input.command) : null;
  return type ? { ...signal, check: { type, passed } } : signal;
}

function responseText(response) {
  if (response == null) return '';
  if (typeof response === 'string') return response;
  const parts = [];
  for (const key of ['stdout', 'stderr', 'output', 'error', 'content', 'result']) {
    const value = response[key];
    if (typeof value === 'string') parts.push(value);
  }
  return parts.length ? parts.join('\n') : JSON.stringify(response);
}

const tailOf = (text) => (text.length > MAX_OUTPUT ? text.slice(-MAX_OUTPUT) : text);

// true = green, false = red, null = could not tell. `exitOk` is true when
// the command exited 0 (Claude Code's PostToolUse): that is green unless the
// output says otherwise, e.g. `npm test | tail` hides a failing exit code.
function judgeTestOutput(text, exitOk = false) {
  const tail = tailOf(text);
  if (FAIL_MARKERS.some((re) => re.test(tail))) return false;
  if (PASS_MARKERS.some((re) => re.test(tail))) return true;
  return exitOk ? true : null;
}

// The last number a pattern finds, or null.
function lastCount(text, re) {
  let value = null;
  for (const m of text.matchAll(re)) value = Number(m[1]);
  return value;
}

// How many tests passed and failed, as the runner reported it, or null.
function testSummary(text) {
  const tail = tailOf(text);
  const maven = [...tail.matchAll(/Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+)/g)].pop();
  if (maven) {
    const failed = Number(maven[2]) + Number(maven[3]);
    return { passed: Math.max(0, Number(maven[1]) - failed), failed };
  }
  const unittest = lastCount(tail, /^Ran (\d+) tests?\b/gm);
  if (unittest !== null) {
    const failed = (lastCount(tail, /\bfailures=(\d+)/g) || 0) + (lastCount(tail, /\berrors=(\d+)/g) || 0);
    return { passed: Math.max(0, unittest - failed), failed };
  }
  const passed = lastCount(tail, /(\d+)\s+(?:passed|passing)\b/gi) ?? lastCount(tail, /\bPassed:\s*(\d+)/g) ?? lastCount(tail, /^# pass (\d+)/gm);
  const failed = lastCount(tail, /(\d+)\s+(?:failed|failing)\b/gi) ?? lastCount(tail, /\bFailed:\s*(\d+)/g) ?? lastCount(tail, /^# fail (\d+)/gm);
  return passed === null && failed === null ? null : { passed, failed };
}

// The conversation's name: its title if it has one, else the start of the
// last prompt.
function conversationTitle(payload) {
  if (payload.session_title) return String(payload.session_title).slice(0, 60);
  if (typeof payload.prompt !== 'string') return undefined;
  const text = payload.prompt.replace(/\s+/g, ' ').trim();
  if (!text) return undefined;
  return text.length > 48 ? `${text.slice(0, 47)}…` : text;
}

function sessionLabel(payload) {
  if (payload.cwd) return path.basename(String(payload.cwd).replace(/[\\/]+$/, ''));
  if (payload.session_id) return String(payload.session_id).slice(0, 8);
  return 'agent';
}

function classify(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const base = {
    session: payload.session_id || 'default',
    label: sessionLabel(payload),
    title: conversationTitle(payload),
    tool: payload.tool_name || null,
  };
  const command = payload.tool_input && payload.tool_input.command;
  const testing = payload.tool_name === 'Bash' && isTestCommand(command);

  switch (payload.hook_event_name) {
    case 'PreToolUse':
      return testing
        ? { ...base, kind: 'test-start', detail: command }
        : { ...base, kind: 'tool-start', detail: describeTool(payload) };
    case 'PostToolUse':
      if (testing) {
        const response = payload.tool_response;
        const text = responseText(response);
        const passed = response && response.interrupted ? null : judgeTestOutput(text, true);
        return { ...base, kind: 'test-end', passed, summary: testSummary(text), detail: command };
      }
      return withCheck({ ...base, kind: 'tool-done', detail: describeTool(payload) }, payload, true);
    case 'PostToolUseFailure':
      return testing
        ? { ...base, kind: 'test-end', passed: false, summary: testSummary(responseText(payload.error || payload.tool_response)), detail: command }
        : withCheck({ ...base, kind: 'tool-fail', detail: describeTool(payload) }, payload, false);
    case 'Notification':
      return { ...base, kind: 'attention', detail: payload.message || 'Agent needs you' };
    case 'Stop':
      return { ...base, kind: 'turn-end' };
    case 'UserPromptSubmit':
      return { ...base, kind: 'turn-start' };
    case 'SessionStart':
      return { ...base, kind: 'session-start' };
    default:
      return null;
  }
}

function describeTool(payload) {
  const input = payload.tool_input || {};
  const target = input.file_path || input.path || input.pattern || input.command || input.url || input.description || '';
  const short = String(target).split(/[\\/]/).pop().slice(0, 48);
  return short ? `${payload.tool_name} ${short}` : payload.tool_name || 'tool';
}

module.exports = { classify, isTestCommand, checkKind, judgeTestOutput, testSummary, responseText };
