'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classify, isTestCommand, judgeTestOutput } = require('../src/classify');

test('recognises common test runners', () => {
  for (const cmd of ['npm test', 'pnpm run test -- --watch=false', 'npx vitest run', 'pytest -q', 'python -m pytest',
    'go test ./...', 'cargo test', 'dotnet test', 'node --test test/', './gradlew test', 'mvn -q verify', 'make check']) {
    assert.ok(isTestCommand(cmd), cmd);
  }
  for (const cmd of ['npm install', 'git status', 'ls tests/', 'cat test.txt', 'echo latest']) {
    assert.ok(!isTestCommand(cmd), cmd);
  }
});

test('judges test output', () => {
  assert.equal(judgeTestOutput('Tests:       12 passed, 12 total'), true);
  assert.equal(judgeTestOutput('Tests: 1 failed, 11 passed, 12 total'), false);
  assert.equal(judgeTestOutput('===== 30 passed in 1.2s ====='), true);
  assert.equal(judgeTestOutput('==== 2 failed, 28 passed in 1.4s ===='), false);
  assert.equal(judgeTestOutput('ok  \tgithub.com/x/y\t0.012s'), true);
  assert.equal(judgeTestOutput('--- FAIL: TestLogin (0.00s)\nFAIL'), false);
  assert.equal(judgeTestOutput('test result: ok. 4 passed; 0 failed'), true);
  assert.equal(judgeTestOutput('# tests 5\n# pass 5\n# fail 0'), true);
  assert.equal(judgeTestOutput('not ok 2 - logs in\n# pass 4\n# fail 1'), false);
  assert.equal(judgeTestOutput('  5 passing (20ms)\n  0 failing'), true);
  assert.equal(judgeTestOutput('Ran 3 tests in 0.001s\n\nOK'), true);
  assert.equal(judgeTestOutput('building...'), null);
});

const bash = (event, command, extra) => ({
  hook_event_name: event, session_id: 's1', cwd: 'C:\\code\\shop\\', tool_name: 'Bash', tool_input: { command }, ...extra,
});

test('maps Claude Code hook events to signals', () => {
  assert.equal(classify(bash('PreToolUse', 'npm test')).kind, 'test-start');
  assert.equal(classify(bash('PreToolUse', 'npm test')).label, 'shop');
  assert.equal(classify(bash('PreToolUse', 'git status')).kind, 'tool-start');

  const green = classify(bash('PostToolUse', 'npm test', { tool_response: { stdout: '8 passed', stderr: '' } }));
  assert.deepEqual([green.kind, green.passed], ['test-end', true]);

  const red = classify(bash('PostToolUseFailure', 'npm test', { error: 'Exit code 1' }));
  assert.deepEqual([red.kind, red.passed], ['test-end', false]);

  assert.equal(classify(bash('PostToolUseFailure', 'git push', { error: 'Exit code 1' })).kind, 'tool-fail');
  assert.equal(classify({ hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: '/a/b/app.ts' } }).detail, 'Edit app.ts');
  assert.equal(classify({ hook_event_name: 'Notification', message: 'Claude needs your permission' }).kind, 'attention');
  assert.equal(classify({ hook_event_name: 'Stop' }).kind, 'turn-end');
  assert.equal(classify({ hook_event_name: 'SomethingNew' }), null);
  assert.equal(classify(null), null);
});
