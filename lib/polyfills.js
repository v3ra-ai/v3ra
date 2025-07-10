// Polyfills for server-side rendering to prevent browser API errors
if (typeof self === 'undefined') {
  // Define self as an empty object to prevent 'self is not defined' errors
  global.self = {};
}

if (typeof window === 'undefined') {
  // Define minimal window object for server-side
  global.window = {};
}

// Prevent document access errors
if (typeof document === 'undefined') {
  global.document = {};
}

// Prevent navigator access errors
if (typeof navigator === 'undefined') {
  global.navigator = {
    userAgent: 'Mozilla/5.0 (Server)',
  };
} 