'use strict';

// Turns a raw agent hook payload (Claude Code format) into a small,
// agent-agnostic signal the game understands. Adapters for other agents
// only need to produce the same signal kinds.

const path = require('node:path');

const TEST_COMMAND = new RegExp(
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
  ].join('|'),
  'i',
);

// Order matters: a summary like "1 failed, 12 passed" is a failure.
const FAIL_MARKERS = [
  /\b[1-9]\d*\s+(failed|failing|failures?|errors?)\b/i,
  /\bfailures?:\s*[1-9]/i,
  /\bFAIL(ED)?\b/,
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
];

const MAX_OUTPUT = 20000;

function isTestCommand(command) {
  return typeof command === 'string' && TEST_COMMAND.test(command);
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

// true = green, false = red, null = could not tell.
function judgeTestOutput(text) {
  const tail = text.length > MAX_OUTPUT ? text.slice(-MAX_OUTPUT) : text;
  if (FAIL_MARKERS.some((re) => re.test(tail))) return false;
  if (PASS_MARKERS.some((re) => re.test(tail))) return true;
  return null;
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
        return { ...base, kind: 'test-end', passed: judgeTestOutput(responseText(payload.tool_response)), detail: command };
      }
      return { ...base, kind: 'tool-done', detail: describeTool(payload) };
    case 'PostToolUseFailure':
      return testing
        ? { ...base, kind: 'test-end', passed: false, detail: command }
        : { ...base, kind: 'tool-fail', detail: describeTool(payload) };
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

module.exports = { classify, isTestCommand, judgeTestOutput, responseText };
