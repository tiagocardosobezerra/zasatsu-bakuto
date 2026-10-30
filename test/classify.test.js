'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classify, isTestCommand, judgeTestOutput, testSummary } = require('../src/classify');

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

test('reads green and red runs from .NET, Maven and Gradle', () => {
  assert.equal(judgeTestOutput('Passed!  - Failed:     0, Passed:    12, Skipped:     0, Total:    12'), true);
  assert.equal(judgeTestOutput('Failed!  - Failed:     1, Passed:    11, Skipped:     0, Total:    12'), false);
  assert.equal(judgeTestOutput('Tests run: 12, Failures: 0, Errors: 0, Skipped: 0\n[INFO] BUILD SUCCESS'), true);
  assert.equal(judgeTestOutput('Tests run: 12, Failures: 1, Errors: 0\n[INFO] BUILD FAILURE'), false);
  assert.equal(judgeTestOutput('BUILD SUCCESSFUL in 3s'), true);
  assert.equal(judgeTestOutput('BUILD FAILED in 3s'), false);
});

test('a test named after a failure does not turn a green run red', () => {
  assert.equal(judgeTestOutput('  ✓ should FAIL gracefully when offline\n  3 passed'), true);
  assert.equal(judgeTestOutput('FAIL src/cart.test.js\nTests: 1 failed, 2 passed'), false);
  assert.equal(judgeTestOutput('FAILED tests/test_cart.py::test_total - AssertionError'), false);
});

test('a command that exited 0 is green unless its output says otherwise', () => {
  assert.equal(judgeTestOutput('building...', true), true);
  assert.equal(judgeTestOutput('Tests: 1 failed, 2 passed', true), false, 'npm test | tail hides the exit code');
  const quiet = classify(bash('PostToolUse', 'npm test', { tool_response: { stdout: 'done', stderr: '' } }));
  assert.equal(quiet.passed, true);
  const stopped = classify(bash('PostToolUse', 'npm test', { tool_response: { stdout: '', interrupted: true } }));
  assert.equal(stopped.passed, null, 'an interrupted run tells nothing');
});

test('counts what passed and failed', () => {
  assert.deepEqual(testSummary('Tests:       1 failed, 11 passed, 12 total'), { passed: 11, failed: 1 });
  assert.deepEqual(testSummary('===== 30 passed in 1.2s ====='), { passed: 30, failed: null });
  assert.deepEqual(testSummary('Passed!  - Failed:     0, Passed:    12, Skipped:     0'), { passed: 12, failed: 0 });
  assert.deepEqual(testSummary('Tests run: 12, Failures: 1, Errors: 1'), { passed: 10, failed: 2 });
  assert.deepEqual(testSummary('Ran 5 tests in 0.01s\n\nFAILED (failures=2)'), { passed: 3, failed: 2 });
  assert.deepEqual(testSummary('# tests 5\n# pass 4\n# fail 1'), { passed: 4, failed: 1 });
  assert.deepEqual(testSummary('test result: ok. 4 passed; 0 failed'), { passed: 4, failed: 0 });
  assert.equal(testSummary('building...'), null);
  const green = classify(bash('PostToolUse', 'npm test', { tool_response: { stdout: 'Tests: 8 passed, 8 total' } }));
  assert.deepEqual(green.summary, { passed: 8, failed: null });
});

test('words inside quotes or arguments are not commands', () => {
  const { checkKind } = require('../src/classify');
  for (const cmd of ['git commit -m "make npm test pass"', "echo 'run pytest later'", 'grep -rn "go test" docs/', 'cat pytest.ini']) {
    assert.ok(!isTestCommand(cmd), cmd);
  }
  for (const cmd of ['cd app && npm test 2>&1 | tail -20', 'CI=1 npx vitest run', './mvnw -q verify', 'uv run pytest -q', 'sudo make check', 'npm ci; npm test']) {
    assert.ok(isTestCommand(cmd), cmd);
  }
  assert.equal(checkKind('git commit -m "fix tsc errors"'), null);
  assert.equal(checkKind('grep -r eslint package.json'), null);
  assert.equal(checkKind('pnpm exec tsc --noEmit'), 'types');
  assert.equal(checkKind('npm ci && npm run lint'), 'lint');
});
