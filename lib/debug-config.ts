// Debug configuration for console logs
export const DEBUG_CONFIG = {
  // Set to false in production to disable all debug logs
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV !== 'production',
  
  // Individual debug categories
  ENABLE_QUERY_LOGS: process.env.NODE_ENV !== 'production',
  ENABLE_STORE_LOGS: process.env.NODE_ENV !== 'production',
  ENABLE_RENDER_LOGS: false, // Always disabled for performance
};

// Helper function to conditionally log
export const debugLog = (category: keyof typeof DEBUG_CONFIG, ...args: unknown[]) => {
  if (DEBUG_CONFIG.ENABLE_DEBUG_LOGS && DEBUG_CONFIG[category]) {
    console.log(...args);
  }
};