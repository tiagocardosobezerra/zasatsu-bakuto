'use strict';

// Environment variables are ZASATSU_*. The FEVER_* names from before the
// rename still work, so old scripts and OBS setups keep running.

function env(name) {
  return process.env[`ZASATSU_${name}`] || process.env[`FEVER_${name}`] || undefined;
}

module.exports = { env };
