'use strict';

// "One machine per conversation" mode: each conversation plays its own
// machine (own domain, stage, totals), and the overlay shows the one it
// follows: the conversation you last sent a message to. It moves on when
// that one is done or has been quiet for a while, but never in the middle
// of its 4:11 jackpot round. These machines live only while the app runs.

const { createGame } = require('./game');

const QUIET_MS = 2 * 60 * 1000; // a followed conversation this quiet can be left

function createEach({ makeGame = () => createGame(), now = Date.now } = {}) {
  const games = new Map(); // conversation id -> its own machine
  let followed = null; // the conversation on screen

  function gameOf(id) {
    let game = games.get(id);
    if (!game) {
      game = makeGame();
      games.set(id, game);
    }
    return game;
  }

  // Whether the overlay should switch to `session`, which just did `signal`.
  function considerFollow(session, signal, sessions) {
    if (!followed || !sessions.find(followed)) {
      followed = session.id;
      return true;
    }
    if (followed === session.id) return false;
    // The jackpot round is the show: stay until its 4:11 is over.
    if (gameOf(followed).snapshot().domain === 'round') return false;
    const current = sessions.find(followed);
    const leave = signal.kind === 'turn-start' || current.state === 'done' || now() - current.lastAt > QUIET_MS;
    if (leave && signal.kind !== 'turn-end') {
      followed = session.id;
      return true;
    }
    return false;
  }

  // `session` is the conversation as recorded by sessions.note().
  function handle(signal, session, sessions) {
    const game = gameOf(session.id);
    const events = game.handle(signal);
    const switched = considerFollow(session, signal, sessions);
    return { game, events, switched, onScreen: followed === session.id };
  }

  function tick() {
    const out = [];
    for (const [id, game] of games) {
      const events = game.tick();
      if (events.length) out.push({ id, game, events });
    }
    return out;
  }

  return {
    handle,
    tick,
    followed: () => followed,
    game: () => (followed ? gameOf(followed) : null),
  };
}

module.exports = { createEach, QUIET_MS };
