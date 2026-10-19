'use strict';

// A scripted agent session in real Claude Code hook format that walks
// through the domain: expansion, indicators, a red-test riichi that misses,
// pseudo-consecutive effects (some fail) up to x4, then a green-test
// jackpot. The demo machine uses a fixed seed so it tells this story every
// time; real sessions use real randomness.

const DEMO_SEED = 92;

// mulberry32: small deterministic PRNG.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function demoScript() {
  const base = { session_id: 'demo-session', cwd: '/home/dev/my-app' };
  const tool = (event, name, input, extra = {}) => ({ ...base, hook_event_name: event, tool_name: name, tool_input: input, ...extra });
  const test = { command: 'npm test', description: 'Run tests' };
  const lint = { command: 'npm run lint' };
  const lintFail = () => tool('PostToolUseFailure', 'Bash', lint, { error: 'Exit code 1' });

  const steps = [
    [0, { ...base, hook_event_name: 'UserPromptSubmit', prompt: 'fix the login bug' }],
    [3400, tool('PostToolUse', 'Read', { file_path: 'src/auth.ts' })],
    [4700, tool('PostToolUse', 'Edit', { file_path: 'src/auth.ts' })],
    [6000, tool('PostToolUse', 'Grep', { pattern: 'session' })],
    [7300, tool('PreToolUse', 'Bash', test)],
    [12800, tool('PostToolUseFailure', 'Bash', test, { error: 'Exit code 1\nTests: 1 failed, 11 passed' })],
    [17200, lintFail()],
    [18500, lintFail()],
    [19800, lintFail()],
    [21100, lintFail()],
    [22400, lintFail()],
    [23700, lintFail()],
    [25200, tool('PostToolUse', 'Edit', { file_path: 'src/auth.ts' })],
    [26600, tool('PreToolUse', 'Bash', test)],
    [32000, tool('PostToolUse', 'Bash', test, { tool_response: { stdout: 'Tests: 12 passed, 12 total', stderr: '', interrupted: false } })],
    [42000, lintFail()],
    [44000, tool('PostToolUse', 'Read', { file_path: 'src/auth.ts' })],
    [46000, tool('PostToolUse', 'Read', { file_path: 'src/session.ts' })],
    [48000, tool('PostToolUse', 'Read', { file_path: 'src/user.ts' })],
    [50000, { ...base, hook_event_name: 'Stop' }],
  ];
  return steps.map(([delay, payload]) => ({ delay, payload }));
}

// Short scripts for the settings page previews.
function previewScript(kind) {
  const base = { session_id: 'preview', cwd: '/preview' };
  const prompt = { ...base, hook_event_name: 'UserPromptSubmit', prompt: 'preview' };
  if (kind === 'expand') return [{ delay: 0, payload: prompt }];
  const test = { command: 'npm test' };
  const fail = { ...base, hook_event_name: 'PostToolUseFailure', tool_name: 'Bash', tool_input: { command: 'npm run lint' }, error: 'Exit code 1' };
  return [
    [0, prompt],
    [3600, fail],
    [4400, fail],
    [5200, fail],
    [6200, { ...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: test }],
    [9200, { ...base, hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: test, tool_response: { stdout: '3 passed' } }],
  ].map(([delay, payload]) => ({ delay, payload }));
}

module.exports = { demoScript, previewScript, seeded, DEMO_SEED };
