// Server-side polyfills - executed BEFORE any vendor code
// This prevents 'self is not defined' errors from browser-only libraries

/* eslint-disable */

// Define global browser APIs that server-side code might expect
if (typeof global !== 'undefined') {
  // Satisfy libraries that expect 'self' to exist
  global.self = global.self || globalThis;
  
  // Dummy browser APIs for server environment
  global.window = global.window || {};
  global.document = global.document || {};
  global.navigator = global.navigator || { 
    userAgent: 'Mozilla/5.0 (Node.js Server)',
    platform: 'node'
  };
  
  // Ensure crypto is available (Node ≥ 20 has it natively)
  try {
    if (!global.self.crypto) {
      global.self.crypto = require('crypto').webcrypto;
    }
  } catch (e) {
    // Fallback if crypto.webcrypto is not available
    global.self.crypto = {
      getRandomValues: (arr) => {
        const bytes = require('crypto').randomBytes(arr.length);
        arr.set(bytes);
        return arr;
      }
    };
  }
  
  // Additional browser globals that might be referenced
  global.location = global.location || {
    href: 'http://localhost',
    origin: 'http://localhost',
    protocol: 'http:',
    host: 'localhost'
  };
  
  global.history = global.history || {
    pushState: () => {},
    replaceState: () => {},
    go: () => {},
    back: () => {},
    forward: () => {}
  };
}

// Export to ensure this module is executed
module.exports = {}; 