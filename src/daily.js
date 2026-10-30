'use strict';

// What the day looked like, kept for the last two weeks: how many turns the
// agents worked, how their tests and builds went, and how long they sat
// waiting for you. Shown by "ryoiki status" and GET /stats. Counted from
// hook events only, on this computer.

const KEEP_DAYS = 14;

function dayKey(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function emptyDay() {
  return { turns: 0, tools: 0, toolFails: 0, testsGreen: 0, testsRed: 0, checksGreen: 0, checksRed: 0, calls: 0, waitMs: 0, waits: 0 };
}

function createDaily({ now = Date.now, saved = null } = {}) {
  const days = {};
  if (saved && typeof saved === 'object' && saved.days && typeof saved.days === 'object') {
    for (const [key, day] of Object.entries(saved.days)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !day || typeof day !== 'object') continue;
      const clean = emptyDay();
      for (const field of Object.keys(clean)) if (Number.isFinite(day[field]) && day[field] >= 0) clean[field] = day[field];
      days[key] = clean;
    }
  }

  function today() {
    const key = dayKey(now());
    if (!days[key]) {
      days[key] = emptyDay();
      const keys = Object.keys(days).sort();
      for (const old of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete days[old];
    }
    return days[key];
  }

  // `waited` is how long the conversation had been waiting for you (sessions.js).
  function note(signal, waited = 0) {
    if (!signal) return;
    const d = today();
    if (waited > 0) {
      d.waitMs += waited;
      d.waits += 1;
    }
    switch (signal.kind) {
      case 'turn-start':
        d.turns += 1;
        break;
      case 'tool-done':
        d.tools += 1;
        break;
      case 'tool-fail':
        d.tools += 1;
        d.toolFails += 1;
        break;
      case 'test-end':
        d.tools += 1;
        if (signal.passed === true) d.testsGreen += 1;
        if (signal.passed === false) d.testsRed += 1;
        break;
      case 'attention':
        d.calls += 1;
        break;
      default:
        break;
    }
    if (signal.check && signal.check.passed === true) d.checksGreen += 1;
    if (signal.check && signal.check.passed === false) d.checksRed += 1;
  }

  // Today, and the sum of the last seven days.
  function report() {
    const t = today();
    const cutoff = dayKey(now() - 6 * 24 * 60 * 60 * 1000);
    const week = emptyDay();
    for (const [key, day] of Object.entries(days)) {
      if (key < cutoff) continue;
      for (const field of Object.keys(week)) week[field] += day[field];
    }
    return { date: dayKey(now()), today: { ...t }, week };
  }

  return { note, report, saved: () => ({ days: structuredClone(days) }) };
}

const minutes = (ms) => (ms < 60000 ? `${Math.round(ms / 1000)} s` : `${Math.round(ms / 60000)} min`);

// A few lines for "ryoiki status".
function formatReport({ today, week }) {
  const line = (name, d) => {
    const tests = d.testsGreen + d.testsRed ? `tests ${d.testsGreen} green / ${d.testsRed} red` : 'no tests';
    const checks = d.checksGreen + d.checksRed ? `, builds/lints ${d.checksGreen} ok / ${d.checksRed} failed` : '';
    const wait = d.waits ? `, agents waited for you ${minutes(d.waitMs)} (${d.waits}×, avg ${minutes(d.waitMs / d.waits)})` : '';
    return `${name}: ${d.turns} turns, ${d.tools} tool calls (${d.toolFails} failed), ${tests}${checks}${wait}.`;
  };
  return [line('Today', today), line('Last 7 days', week)];
}

module.exports = { createDaily, formatReport, dayKey, KEEP_DAYS };
