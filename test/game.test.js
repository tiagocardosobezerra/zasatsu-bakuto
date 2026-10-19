'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame, ROUND_MS } = require('../src/game');

const signal = (kind, extra = {}) => ({ kind, session: 's1', label: 'shop', ...extra });

// Scripted randomness: values are consumed in order, then `fallback` repeats.
function rng(values, fallback = 0.5) {
  const queue = [...values];
  return () => (queue.length ? queue.shift() : fallback);
}
function clock(start = 0) {
  let t = start;
  const now = () => t;
  now.advance = (ms) => (t += ms);
  return now;
}
const types = (events) => events.map((e) => e.type);

test('a prompt expands the domain in normal probability', () => {
  const game = createGame({ random: rng([]) });
  const events = game.handle(signal('turn-start'));
  assert.deepEqual(types(events), ['expand', 'status']);
  assert.equal(events[0].mode, 'normal');
  assert.equal(events[0].domain, 'open');
});

test('tool calls spin; edits are shutter doors, other tools reserve balls, failures consecutive effects', () => {
  const game = createGame({ random: rng([]) });
  game.handle(signal('turn-start'));
  const [door] = game.handle(signal('tool-done', { tool: 'Edit' }));
  const [ball] = game.handle(signal('tool-done', { tool: 'Read' }));
  const [redo] = game.handle(signal('tool-fail', { tool: 'Bash' }));
  assert.deepEqual([door.indicator.kind, ball.indicator.kind, redo.indicator.kind], ['door', 'ball', 'consecutive']);
  assert.equal(redo.stage.holds.length, 1);
  assert.equal(redo.stage.consecutive, 1);
  assert.notEqual(door.reels[0], door.reels[1]);
  assert.equal(redo.stats.spins, 3);
});

test('a consecutive effect often fails outside increased probability', () => {
  const game = createGame({ random: rng([0.99, 0.5, 0.1]) }); // lottery lost, colour, fail roll 0.1 < 0.5
  game.handle(signal('turn-start'));
  const [redo] = game.handle(signal('tool-fail', { tool: 'Bash' }));
  assert.equal(redo.indicator.failed, true);
  assert.equal(redo.stage.consecutive, 0);
});

test('riichi always follows at least one indicator', () => {
  const game = createGame({ random: rng([]) });
  game.handle(signal('turn-start'));
  const [riichi] = game.handle(signal('test-start'));
  assert.ok(riichi.stage.best);
  assert.equal(riichi.stage.holds.length, 1);
});

test('red tests always miss and send the stage back to the start', () => {
  const game = createGame({ random: rng([]) });
  game.handle(signal('turn-start'));
  game.handle(signal('tool-fail', { tool: 'Bash' }));
  const [riichi] = game.handle(signal('test-start'));
  assert.equal(riichi.type, 'riichi');
  assert.equal(riichi.reels[2], null);
  assert.ok(riichi.scenario.name.endsWith('Riichi'));
  const [miss] = game.handle(signal('test-end', { passed: false }));
  assert.deepEqual([miss.type, miss.reason], ['miss', 'tests-red']);
  assert.notEqual(miss.reels[2], miss.reels[0]);
  assert.equal(miss.stage.consecutive, 0);
  assert.equal(miss.domain, 'open');
});

test('pseudo-consecutive x4 (three redos) guarantees the jackpot on green tests', () => {
  const game = createGame({ random: rng([], 0.99) }); // 0.99 would lose any normal draw
  game.handle(signal('turn-start'));
  for (let i = 0; i < 2; i++) game.handle(signal('tool-fail', { tool: 'Bash' }));
  assert.equal(game.snapshot().stage.guaranteed, false);
  game.handle(signal('tool-fail', { tool: 'Bash' }));
  const [riichi] = game.handle(signal('test-start'));
  assert.equal(riichi.stage.consecutive, 3);
  assert.equal(riichi.stage.guaranteed, true);
  const [win] = game.handle(signal('test-end', { passed: true }));
  assert.equal(win.type, 'jackpot');
  assert.equal(win.guaranteed, true);
  assert.equal(new Set(win.reels).size, 1);
});

test('jackpot opens a 4:11 round, heals failures, then the domain re-expands', () => {
  const now = clock();
  const game = createGame({ random: rng([], 0.99), now });
  game.handle(signal('turn-start'));
  for (let i = 0; i < 3; i++) game.handle(signal('tool-fail'));
  game.handle(signal('test-start'));
  const [win] = game.handle(signal('test-end', { passed: true }));
  assert.equal(win.roundMs, ROUND_MS);
  assert.equal(ROUND_MS, 251000);
  assert.equal(win.domain, 'round');
  assert.deepEqual(types(game.handle(signal('tool-fail'))), ['heal']);
  now.advance(ROUND_MS - 1000);
  assert.deepEqual(game.tick(), []);
  now.advance(1000);
  assert.deepEqual(types(game.tick()), ['round-end', 'expand']);
});

test('odd jackpot carries increased probability into the next domain; even gives faster spins', () => {
  for (const [symbol, odd, nextMode] of [[3, true, 'increased'], [4, false, 'faster']]) {
    const game = createGame({ random: rng([], 0.99), pickSymbol: () => symbol });
    game.handle(signal('turn-start'));
    for (let i = 0; i < 3; i++) game.handle(signal('tool-fail'));
    game.handle(signal('test-start'));
    const [win] = game.handle(signal('test-end', { passed: true }));
    assert.equal(win.odd, odd);
    assert.equal(win.nextMode, nextMode);
    assert.equal(game.snapshot().mode, nextMode);
  }
});

test('even jackpot can secretly carry hidden probability, revealed on the next jackpot', () => {
  const now = clock();
  const game = createGame({ random: rng([], 0.01), now, pickSymbol: () => 2 });
  game.handle(signal('turn-start'));
  game.handle(signal('test-start'));
  const [first] = game.handle(signal('test-end', { passed: true }));
  assert.deepEqual([first.type, first.nextMode, first.hiddenRevealed], ['jackpot', 'faster', false]);
  now.advance(ROUND_MS);
  const [, expanded] = game.tick();
  assert.equal(expanded.mode, 'faster');
  game.handle(signal('test-start'));
  const [second] = game.handle(signal('test-end', { passed: true }));
  assert.deepEqual([second.type, second.hiddenRevealed], ['jackpot', true]);
});

test('a won 1/239 lottery starts a riichi that resolves into a jackpot', () => {
  const game = createGame({ random: rng([], 0.001) }); // 0.001 < 1/239
  game.handle(signal('turn-start'));
  const events = game.handle(signal('tool-done', { tool: 'Read' }));
  assert.deepEqual(types(events), ['spin', 'riichi']);
  const riichi = events[1];
  assert.equal(riichi.riichiKind, 'lottery');
  assert.ok(riichi.resolveIn > 0);
  assert.equal(game.handle(signal('tool-done', { tool: 'Read' }))[0].type, 'hold');
  const [win] = game.resolve(riichi.token);
  assert.equal(win.type, 'jackpot');
  assert.deepEqual(game.resolve(riichi.token), []);
});

test('turn end closes the domain and resets the renchan', () => {
  const game = createGame({ random: rng([]) });
  game.handle(signal('turn-start'));
  game.handle(signal('test-start'));
  const events = game.handle(signal('turn-end'));
  assert.deepEqual(types(events), ['miss', 'collapse', 'turn-end']);
  assert.equal(events[1].domain, 'closed');
  assert.equal(game.handle(signal('tool-done'))[0].type, 'expand');
});

test('faster spins last 70 or 30 spins, then the machine is back to normal', () => {
  const now = clock();
  // 0.99: lose every draw, no consecutive failure; jitan length draw 0.99 -> 30 spins
  const game = createGame({ random: rng([], 0.99), now, pickSymbol: () => 2 });
  game.handle(signal('turn-start'));
  for (let i = 0; i < 3; i++) game.handle(signal('tool-fail'));
  game.handle(signal('test-start'));
  const [win] = game.handle(signal('test-end', { passed: true }));
  assert.equal(win.nextMode, 'faster');
  assert.equal(win.jitanLeft, 30);
  now.advance(ROUND_MS);
  game.tick();
  let ended = null;
  for (let i = 0; i < 30; i++) {
    const [e] = game.handle(signal('tool-done', { tool: 'Read' }));
    if (e.jitanEnded) ended = e;
  }
  assert.ok(ended, 'faster spins ended');
  assert.equal(ended.mode, 'normal');
});

test('about 75% of jackpots enter increased probability', () => {
  let odd = 0;
  const runs = 4000;
  for (let i = 0; i < runs; i++) {
    const game = createGame();
    game.handle(signal('turn-start'));
    for (let j = 0; j < 40 && game.snapshot().stage.consecutive < 3; j++) game.handle(signal('tool-fail'));
    game.handle(signal('test-start'));
    const [e] = game.handle(signal('test-end', { passed: true }));
    if (e.type === 'jackpot' && e.odd) odd += 1;
  }
  const rate = odd / runs;
  assert.ok(rate > 0.71 && rate < 0.79, `kakuhen rate ${rate}`);
});

test('riichi carries canon scenario names and chance-ups', () => {
  const game = createGame({ random: rng([], 0.01) });
  game.handle(signal('turn-start'));
  const [riichi] = game.handle(signal('test-start'));
  assert.ok(riichi.scenario.jp.endsWith('リーチ'));
  assert.equal(typeof riichi.chanceUps, 'object');
  assert.ok(riichi.chanceUps.yume);
});
