'use strict';

// One machine for every conversation. Hakari has one domain: whatever any
// Claude Code conversation does spins the same reels, adds to the same
// totals and shares the same 確変 or 時短. To keep one machine coherent:
//   - only one test riichi plays at a time; tests started by another
//     conversation meanwhile are reserve balls (保留玉), as on a real machine
//   - the domain only closes when no conversation is still working
//   - a conversation that ends its turn during its own test riichi lets
//     that riichi expire, without closing the domain on the others

const { createGame } = require('./game');
const { createSessions } = require('./sessions');

function createMachine({ game = createGame(), sessions = createSessions() } = {}) {
  let riichiOwner = null; // the conversation whose tests the riichi is waiting for

  function track(events, session) {
    for (const e of events) {
      if (e.type === 'riichi' && e.riichiKind === 'test') riichiOwner = session.id;
      if (e.type === 'jackpot' || e.type === 'miss') riichiOwner = null;
    }
    return events;
  }

  function handle(signal) {
    const session = sessions.note(signal);
    const owned = riichiOwner !== null && game.riichiKind() === 'test';
    const out = [];
    switch (signal.kind) {
      case 'test-start':
        if (owned && riichiOwner !== session.id) {
          out.push(...game.handle({ ...signal, kind: 'tool-done', tool: 'Bash' }));
          return { session, events: out };
        }
        break;
      case 'test-end':
        if (!owned || riichiOwner !== session.id) {
          out.push(...game.handle({ ...signal, kind: 'tool-start' }));
          return { session, events: out };
        }
        break;
      case 'turn-end':
        if (sessions.busy(session.id).length) {
          if (owned && riichiOwner === session.id) out.push(...track(game.handle({ ...signal, kind: 'riichi-expire' }), session));
          return { session, events: out };
        }
        break;
      default:
        break;
    }
    out.push(...track(game.handle(signal), session));
    return { session, events: out };
  }

  return {
    handle,
    game,
    sessions,
    tick: () => game.tick(),
    resolve: (id) => game.resolve(id),
  };
}

module.exports = { createMachine };
