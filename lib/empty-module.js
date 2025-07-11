// Empty module stub for browser-only dependencies during server builds
module.exports = {};
module.exports.default = {};

// Common exports that browser libs might have
module.exports.useWallet = () => ({});
module.exports.WalletProvider = () => null;
module.exports.motion = new Proxy({}, {
  get: () => () => null
});

// Mock DOM-like APIs for libraries that check for them
if (typeof global !== 'undefined' && !global.document) {
  global.document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    getElementsByClassName: () => [],
    getElementsByTagName: () => [],
    createElement: () => ({}),
    createTextNode: () => ({}),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { appendChild: () => {}, removeChild: () => {} },
    head: { appendChild: () => {}, removeChild: () => {} },
  };
}

if (typeof global !== 'undefined' && !global.window) {
  global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { href: '', origin: '', pathname: '' },
    innerWidth: 1024,
    innerHeight: 768,
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
  };
}

// Export everything for ES modules
module.exports.useEmblaCarousel = () => [null, {}];
module.exports.EmblaCarousel = class {};
module.exports.AnimatePresence = ({ children }) => children;
module.exports.useAnimation = () => ({}); 