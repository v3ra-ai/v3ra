/* eslint-disable */
// Tiny shim executed before any other server chunk.
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  // Point self to globalThis so browser-only libs won’t crash
  global.self = globalThis;
}
module.exports = {}; 