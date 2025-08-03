// Production-safe logger that only logs in development mode
// or when explicitly enabled via environment variable

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  namespace?: string;
  enabled?: boolean;
}

class Logger {
  private namespace: string;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.namespace = options.namespace || 'app';
    this.enabled = options.enabled ?? (process.env.NODE_ENV === 'development' || process.env.ENABLE_LOGGING === 'true');
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}] ${message}`;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.enabled) return;

    const formattedMessage = this.formatMessage(level, message);

    switch (level) {
      case 'debug':
        console.log(formattedMessage, data !== undefined ? data : '');
        break;
      case 'info':
        console.info(formattedMessage, data !== undefined ? data : '');
        break;
      case 'warn':
        console.warn(formattedMessage, data !== undefined ? data : '');
        break;
      case 'error':
        console.error(formattedMessage, data !== undefined ? data : '');
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  // Create a child logger with a sub-namespace
  child(subNamespace: string): Logger {
    return new Logger({
      namespace: `${this.namespace}:${subNamespace}`,
      enabled: this.enabled
    });
  }
}

// Factory function to create loggers
export function createLogger(namespace: string): Logger {
  return new Logger({ namespace });
}

// Default logger instance
export const logger = new Logger();

// API logger instance for server-side logging
export const apiLogger = new Logger({ namespace: 'api' });