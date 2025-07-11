// Empty module stub for browser-only dependencies during server builds
module.exports = {};
module.exports.default = {};

// Common exports that browser libs might have
module.exports.useWallet = () => ({});
module.exports.WalletProvider = () => null;
module.exports.motion = new Proxy({}, {
  get: () => () => null
}); 