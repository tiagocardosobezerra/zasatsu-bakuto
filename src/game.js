'use strict';

// Idle Death Gamble: CR Private Pure Love Train Ver. 1/239, played by an AI
// coding agent. Rules follow the rule sheet Hakari shows in chapter 183
// ("CR私鉄純愛列車") and the fights in chapters 182-190; the agent's hook
// events are the fight.
//
//   Domain Expansion ........ the user sends a prompt (or the agent acts while
//                              no domain is open)
//   Spin + lottery .......... every finished tool call draws at about 1/239
//   Notice effects 予告演出 ... Edit/Write = shutter doors, other tools =
//                              reserve balls, a failed tool call that the agent
//                              redoes = pseudo-consecutive 疑似連 (x2, x3, x4).
//                              Green < red < gold. Rainbow, or reaching x4,
//                              confirms the jackpot. 疑似連 carries a high risk
//                              of failing outside increased probability (ch. 187)
//   Riichi .................. develops once at least one effect has played:
//                              a test run (or a won lottery) reveals two of the
//                              three numbers and plays one of four scenarios
//   Chance up ............... Yume background, Amanokawa cut-in, group notice
//                              (anything but trains = confirmed)
//   Result .................. red tests always miss; green tests hit with the
//                              scenario's reliability. A miss sends the stage
//                              back to the start
//   Jackpot ................. the domain disappears; 4:11 of unlimited cursed
//                              energy ("Admiring You"). Failures are healed by
//                              the automatic reverse cursed technique
//   Game flow ............... odd triple = 確変 (increased probability) until
//                              the next jackpot; even = 時短 (faster spins) for
//                              70 or 30 spins, then normal. Kakuhen entry ~75%.
//                              An even jackpot can secretly be 潜伏確変 (hidden
//                              probability, ch. 189)
//
// Outcomes are decided here so every overlay shows the same machine.

const SYMBOLS = 7;
const ROUND_MS = (4 * 60 + 11) * 1000;
const LOTTERY_RIICHI_MS = 7000;

const ODDS = { normal: 1 / 239, faster: 1 / 239, increased: 1 / 24, hidden: 1 / 24 };
const BASE_HIT = { normal: 0.25, faster: 0.25, increased: 0.6, hidden: 0.6 };
const COLOR_RANK = { green: 1, red: 2, gold: 3, rainbow: 4 };
const COLOR_BONUS = { green: 0, red: 0.15, gold: 0.35 };
// 疑似連: the first redo shows x2. "4回目" (x4) confirms, i.e. three redos.
const GUARANTEE_CONSECUTIVE = 3;
// Chance a 疑似連 fails to replay. Hakari only relies on it in increased
// probability because it is risky otherwise; the manga gives no number.
const CONSECUTIVE_FAIL = { normal: 0.5, faster: 0.5, increased: 0.1, hidden: 0.1 };
const KAKUHEN_RATE = 0.75; // 確変突入率 約75% (rule sheet)
const JITAN_SPINS = [70, 30]; // 規定回数消化 70 or 30回転 (rule sheet)
const HIDDEN_RATE = 0.25; // ours: the manga only says "a chance"

const SCENARIOS = {
  transit: { id: 'transit', jp: '交通系ICカードリーチ', name: 'Transit Card Riichi', stars: 1 },
  seat: { id: 'seat', jp: '座席争奪通勤リーチ', name: 'Seat Struggle Riichi', stars: 2 },
  potty: { id: 'potty', jp: 'うっかり特快便意我慢リーチ', name: 'Potty Emergency Riichi', stars: 2 },
  final: { id: 'final', jp: '華金終電リーチ', name: 'Friday Night Final Train Riichi', stars: 3 },
};
// Scenario choice depends on the (already decided) outcome, like a real
// pachinko machine. These weights make the final train hit over 80% of the
// time even with only green effects ("期待度80%超え"), and the transit card rarely.
const SCENARIO_WEIGHTS = {
  hit: { transit: 1, seat: 3, potty: 3, final: 8 },
  miss: { transit: 8, seat: 4, potty: 4, final: 0.5 },
};
// Chance-up presentations, also chosen from the decided outcome.
const CHANCE_UP = {
  hit: { yume: 0.35, amanokawa: 0.3, group: 0.25, groupOther: 0.4 },
  miss: { yume: 0.05, amanokawa: 0.04, group: 0.08, groupOther: 0 },
};

const DOOR_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

// `saved` is what `saved()` returned before: totals and the probability mode
// carry over when the app restarts. A domain, riichi or round in progress
// does not.
function createGame({ random = Math.random, now = Date.now, pickSymbol, saved = null } = {}) {
  const stats = { spins: 0, jackpots: 0, misses: 0, domains: 0, renchan: 0, bestRenchan: 0 };
  let mode = 'normal'; // normal | increased | faster | hidden
  let jitanLeft = 0; // spins left in faster spins (also shown during hidden)
  let domain = 'closed'; // closed | open | round
  let stage = freshStage();
  let riichi = null;
  let round = null;
  let turnActive = false;
  let token = 0;
  let last = { label: 'agent', session: 'default' };
  if (saved && typeof saved === 'object') restore(saved);

  function restore(data) {
    for (const key of Object.keys(stats)) {
      const v = data.stats && data.stats[key];
      if (Number.isInteger(v) && v >= 0) stats[key] = v;
    }
    if (['normal', 'increased', 'faster', 'hidden'].includes(data.mode)) mode = data.mode;
    if (Number.isInteger(data.jitanLeft) && data.jitanLeft >= 0 && data.jitanLeft <= 100) jitanLeft = data.jitanLeft;
    if ((mode === 'faster') && !jitanLeft) mode = 'normal';
  }

  function freshStage() {
    return { holds: [], best: null, consecutive: 0 };
  }

  const pick = pickSymbol || (() => 1 + Math.floor(random() * SYMBOLS));
  const ODD = [1, 3, 5, 7];
  const EVEN = [2, 4, 6];
  function winningSymbol() {
    if (pickSymbol) return pickSymbol();
    const set = random() < KAKUHEN_RATE ? ODD : EVEN;
    return set[Math.floor(random() * set.length)];
  }

  // Hidden probability looks like faster spins, then like normal.
  function visibleMode() {
    if (mode === 'hidden') return jitanLeft > 0 ? 'faster' : 'normal';
    return mode;
  }

  function weighted(table) {
    const entries = Object.entries(table);
    let roll = random() * entries.reduce((sum, [, w]) => sum + w, 0);
    for (const [key, w] of entries) {
      roll -= w;
      if (roll < 0) return key;
    }
    return entries[entries.length - 1][0];
  }

  function indicatorColor(won) {
    return won
      ? weighted({ red: 20, gold: 50, rainbow: 30 })
      : weighted({ green: 700, red: 220, gold: 75, rainbow: 5 });
  }

  function losingReels() {
    const a = pick();
    let b = pick();
    if (b === a) b = (b % SYMBOLS) + 1; // two equal would read as a riichi
    return [a, b, pick()];
  }

  function guaranteed() {
    return stage.best === 'rainbow' || stage.consecutive >= GUARANTEE_CONSECUTIVE;
  }

  function event(type, extra = {}) {
    return {
      type,
      label: last.label,
      session: last.session,
      mode: visibleMode(),
      // The jackpot odds the player sees (潜伏確変 hides its better odds).
      odds: Math.round(1 / ODDS[visibleMode()]),
      jitanLeft: mode === 'faster' || mode === 'hidden' ? jitanLeft : 0,
      domain,
      stage: {
        holds: [...stage.holds],
        best: stage.best,
        consecutive: stage.consecutive,
        guaranteed: guaranteed(),
      },
      stats: { ...stats },
      roundEndsAt: round ? round.endsAt : null,
      at: now(),
      ...extra,
    };
  }

  function expand() {
    domain = 'open';
    stage = freshStage();
    stats.domains += 1;
    return event('expand');
  }

  function addIndicator(kind, color) {
    if (kind === 'ball') {
      stage.holds.push(color);
      if (stage.holds.length > 4) stage.holds.shift();
    }
    if (kind === 'consecutive') {
      if (random() < CONSECUTIVE_FAIL[mode]) return false;
      stage.consecutive += 1;
    }
    if (!stage.best || COLOR_RANK[color] > COLOR_RANK[stage.best]) stage.best = color;
    return true;
  }

  // Faster spins run out after its 70 or 30 spins.
  function countJitan() {
    if (mode !== 'faster' && mode !== 'hidden') return false;
    if (jitanLeft <= 0) return false;
    jitanLeft -= 1;
    if (jitanLeft === 0 && mode === 'faster') {
      mode = 'normal';
      return true;
    }
    return false;
  }

  function chanceUps(hit) {
    const odds = CHANCE_UP[hit ? 'hit' : 'miss'];
    const ups = {};
    if (random() < odds.yume) ups.yume = true;
    if (random() < odds.amanokawa) ups.amanokawa = true;
    if (random() < odds.group) ups.group = random() < odds.groupOther ? 'other' : 'train';
    return ups;
  }

  function startRiichi(kind, hit) {
    const symbol = hit ? winningSymbol() : pick();
    const scenario = SCENARIOS[weighted(SCENARIO_WEIGHTS[hit ? 'hit' : 'miss'])];
    const ups = chanceUps(hit);
    token += 1;
    riichi = { kind, hit, symbol, scenario, token };
    const extra = { reels: [symbol, symbol, null], scenario, riichiKind: kind, chanceUps: ups };
    if (kind === 'lottery') Object.assign(extra, { resolveIn: LOTTERY_RIICHI_MS, token });
    return event('riichi', extra);
  }

  function hitChanceIfGreen() {
    if (guaranteed()) return 1;
    return Math.min(0.95, BASE_HIT[mode] + (COLOR_BONUS[stage.best] || 0));
  }

  function jackpot(detail) {
    const { symbol, scenario } = riichi;
    const odd = symbol % 2 === 1;
    const hiddenRevealed = mode === 'hidden';
    const wasGuaranteed = guaranteed();
    if (odd) {
      mode = 'increased';
      jitanLeft = 0;
    } else {
      mode = random() < HIDDEN_RATE ? 'hidden' : 'faster';
      jitanLeft = JITAN_SPINS[random() < 0.5 ? 0 : 1];
    }
    riichi = null;
    stage = freshStage();
    domain = 'round';
    round = { endsAt: now() + ROUND_MS };
    stats.jackpots += 1;
    stats.renchan += 1;
    stats.bestRenchan = Math.max(stats.bestRenchan, stats.renchan);
    return event('jackpot', {
      reels: [symbol, symbol, symbol],
      scenario,
      odd,
      hiddenRevealed,
      guaranteed: wasGuaranteed,
      nextMode: visibleMode(),
      roundMs: ROUND_MS,
      detail,
    });
  }

  function miss(reason, detail) {
    const { symbol, scenario } = riichi;
    riichi = null;
    stage = freshStage();
    stats.misses += 1;
    return event('miss', { reels: [symbol, symbol, (symbol % SYMBOLS) + 1], scenario, reason, detail });
  }

  function spin(signal, kind) {
    stats.spins += 1;
    const jitanEnded = countJitan();
    const won = random() < ODDS[mode];
    const color = indicatorColor(won);
    if (riichi) {
      // A riichi is already playing: the spin is held as a reserve ball.
      if (kind === 'ball') addIndicator(kind, color);
      return [event('hold', { indicator: { kind, color }, jitanEnded, detail: signal.detail })];
    }
    const ok = addIndicator(kind, color);
    const indicator = ok ? { kind, color } : { kind, color, failed: true };
    const out = [event('spin', { reels: losingReels(), indicator, jitanEnded, detail: signal.detail })];
    if (won) out.push(startRiichi('lottery', true));
    return out;
  }

  function handle(signal) {
    if (!signal) return [];
    last = { label: signal.label, session: signal.session };
    const out = [];
    const working = ['turn-start', 'tool-start', 'tool-done', 'tool-fail', 'test-start', 'test-end'].includes(signal.kind);
    if (working) turnActive = true;
    if (working && domain === 'closed') out.push(expand());

    if (domain === 'round') {
      switch (signal.kind) {
        case 'tool-done':
          out.push(random() < 0.1 ? event('bonus', { detail: signal.detail }) : event('status', { detail: signal.detail }));
          break;
        case 'tool-fail':
          out.push(event('heal', { detail: signal.detail }));
          break;
        case 'test-end':
          out.push(event(signal.passed === false ? 'heal' : 'bonus', { detail: signal.detail }));
          break;
        case 'attention':
          out.push(event('attention', { detail: signal.detail }));
          break;
        case 'turn-end':
          turnActive = false;
          out.push(event('turn-end'));
          break;
        case 'riichi-expire':
          break;
        default:
          out.push(event('status', { detail: signal.detail }));
      }
      return out;
    }

    switch (signal.kind) {
      case 'turn-start':
      case 'session-start':
      case 'tool-start':
        out.push(event('status', { detail: signal.detail }));
        break;

      case 'tool-done':
        out.push(...spin(signal, DOOR_TOOLS.has(signal.tool) ? 'door' : 'ball'));
        break;

      case 'tool-fail':
        out.push(...spin(signal, 'consecutive'));
        break;

      case 'test-start': {
        if (riichi && riichi.kind === 'lottery') {
          out.push(event('status', { detail: signal.detail }));
          break;
        }
        stats.spins += 1;
        countJitan();
        // Riichi only develops after at least one effect; a reserve ball is thrown.
        if (!stage.best) addIndicator('ball', indicatorColor(false));
        const e = startRiichi('test', random() < hitChanceIfGreen());
        e.detail = signal.detail;
        out.push(e);
        break;
      }

      case 'test-end':
        if (!riichi || riichi.kind !== 'test') {
          out.push(event('status', { detail: signal.detail }));
          break;
        }
        if (signal.passed === false) out.push(miss('tests-red', signal.detail));
        else if (signal.passed === null) out.push(miss('unknown', signal.detail));
        else out.push(riichi.hit ? jackpot(signal.detail) : miss('scenario-failed', signal.detail));
        break;

      case 'attention':
        out.push(event('attention', { detail: signal.detail }));
        break;

      // The conversation that started the tests ended its turn while others
      // keep the domain open: its riichi expires, the domain stays.
      case 'riichi-expire':
        if (riichi && riichi.kind === 'test') out.push(miss('expired'));
        break;

      case 'turn-end':
        turnActive = false;
        if (riichi && riichi.kind === 'test') out.push(miss('expired'));
        if (!riichi) {
          domain = 'closed';
          stage = freshStage();
          stats.renchan = 0;
          out.push(event('collapse'));
        }
        out.push(event('turn-end'));
        break;

      default:
        break;
    }
    return out;
  }

  // A won lottery riichi plays for a few seconds, then lands the jackpot.
  function resolve(id) {
    if (!riichi || riichi.token !== id || domain !== 'open') return [];
    return [jackpot()];
  }

  // Called about once a second: ends the 4:11 round.
  function tick() {
    if (domain !== 'round' || now() < round.endsAt) return [];
    round = null;
    domain = 'closed';
    const out = [event('round-end')];
    if (turnActive) out.push(expand());
    return out;
  }

  return {
    handle,
    resolve,
    tick,
    stats: () => ({ ...stats }),
    snapshot: () => event('hello'),
    saved: () => ({ stats: { ...stats }, mode, jitanLeft }),
    riichiKind: () => (riichi ? riichi.kind : null),
  };
}

module.exports = { createGame, SCENARIOS, ROUND_MS, ODDS, SYMBOLS, KAKUHEN_RATE, JITAN_SPINS };
