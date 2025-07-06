/**
 * Production-safe logger utility
 * Only logs in development environment unless forced
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  force?: boolean; // Force logging even in production
  context?: string; // Add context prefix to logs
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, data?: any, options?: LoggerOptions) {
    if (!this.isDevelopment && !options?.force) {
      return;
    }
    
    const prefix = options?.context ? `[${options.context}]` : '';
    const logMessage = `${prefix} ${message}`.trim();
    
    switch (level) {
      case 'debug':
        console.log(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }
  }
  
  debug(message: string, data?: any, options?: LoggerOptions) {
    this.log('debug', message, data, options);
  }
  
  info(message: string, data?: any, options?: LoggerOptions) {
    this.log('info', message, data, options);
  }
  
  warn(message: string, data?: any, options?: LoggerOptions) {
    this.log('warn', message, data, options);
  }
  
  error(message: string, data?: any, options?: LoggerOptions) {
    // Always log errors
    this.log('error', message, data, { ...options, force: true });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for backward compatibility
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, data?: any) => logger.error(message, data),
};