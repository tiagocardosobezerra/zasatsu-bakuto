// What the conversation lines show besides the name: how long the turn has
// run, and the real results the show must never hide (last tests, last
// build/lint/type check, context in use). Pure functions, so the tests can
// run them without a browser (test/lines.test.js).
(() => {
  'use strict';

  const CONTEXT_SHOW = 50; // the context chip shows from this %…
  const CONTEXT_WARN = 80; // …and turns red from this one

  function elapsed(ms) {
    const m = Math.floor(Math.max(0, ms) / 60000);
    if (m < 1) return '<1m';
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
  }

  const minutesSince = (at, now) => Math.max(1, Math.floor((now - at) / 60000));

  // Each chip: { result: pass | fail | unknown, text, key (i18n tooltip) }.
  function testChip(t) {
    const result = t.passed === true ? 'pass' : t.passed === false ? 'fail' : 'unknown';
    const sum = t.summary || {};
    const total = (sum.passed || 0) + (sum.failed || 0);
    let count = '';
    if (result === 'pass' && sum.passed != null) count = ` ${sum.passed}`;
    if (result === 'fail' && sum.failed) count = total > sum.failed ? ` ${sum.failed}/${total}` : ` ${sum.failed}`;
    const mark = { pass: '✓', fail: '✗', unknown: '?' }[result];
    return { result, text: `${mark}${count}`, key: { pass: 'testPassed', fail: 'testFailed', unknown: 'testUnknownTip' }[result] };
  }

  function checkChip(c) {
    const name = { build: 'build', lint: 'lint', types: 'tsc' }[c.type] || String(c.type);
    return { result: c.passed ? 'pass' : 'fail', text: `${name} ${c.passed ? '✓' : '✗'}`, key: c.passed ? 'checkPassed' : 'checkFailed' };
  }

  function contextChip(pct) {
    return { result: pct >= CONTEXT_WARN ? 'fail' : 'unknown', text: `ctx ${pct}%`, key: 'contextTip' };
  }

  // Every chip a conversation line gets, in order.
  function chips(s) {
    const out = [];
    if (s.lastTest) out.push(testChip(s.lastTest));
    if (s.lastCheck) out.push(checkChip(s.lastCheck));
    if (s.context != null && s.context >= CONTEXT_SHOW) out.push(contextChip(s.context));
    return out;
  }

  window.DomainLines = { elapsed, minutesSince, testChip, checkChip, contextChip, chips, CONTEXT_SHOW, CONTEXT_WARN };
})();
