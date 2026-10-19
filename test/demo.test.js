'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classify } = require('../src/classify');
const { createGame } = require('../src/game');
const { demoScript, seeded, DEMO_SEED } = require('../src/demo');

test('the seeded demo always tells the whole story', () => {
  let t = 0;
  const game = createGame({ random: seeded(DEMO_SEED), now: () => t });
  const events = [];
  for (const { delay, payload } of demoScript()) {
    t = delay;
    events.push(...game.handle(classify(payload)));
  }
  const find = (type) => events.find((e) => e.type === type);
  assert.equal(events[0].type, 'expand');
  assert.equal(find('miss').reason, 'tests-red');
  assert.ok(events.some((e) => e.type === 'spin' && e.indicator.failed), 'a consecutive effect fails');
  const jackpot = find('jackpot');
  assert.ok(jackpot.guaranteed, 'pseudo-consecutive x4 guarantees it');
  assert.ok(find('heal'), 'failures heal during the round');
  assert.ok(!events.some((e) => e.riichiKind === 'lottery'));
  const second = events.filter((e) => e.type === 'riichi')[1];
  assert.equal(second.scenario.id, 'final');
  assert.deepEqual(second.chanceUps, { yume: true, amanokawa: true, group: 'other' });
});
