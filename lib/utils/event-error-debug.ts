// Debug utility to help track down event errors
import { createLogger } from '@/lib/logger';

const logger = createLogger('event-error-debug');
export function wrapEventHandler<T extends (...args: any[]) => any>(
  handler: T,
  componentName: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = handler(...args);
      
      // If it's a promise, wrap the rejection
      if (result instanceof Promise) {
        return result.catch((error) => {
          // Check if the error is an Event object
          if (error && typeof error === 'object' && 'isTrusted' in error) {
            logger.error('Event object thrown as error', { componentName,
              eventType: error.type || 'unknown',
              target: error.target?.tagName || 'unknown',
              handler: handler.name || 'anonymous',
              stack: new Error().stack
            });
            
            // Return a proper error instead
            throw new Error(`Event handler error in ${componentName}`);
          }
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      // Check if the error is an Event object
      if (error && typeof error === 'object' && 'isTrusted' in error) {
        logger.error('Sync event object thrown as error', { componentName,
          eventType: (error as any).type || 'unknown',
          target: (error as any).target?.tagName || 'unknown',
          handler: handler.name || 'anonymous'
        });
        
        // Throw a proper error instead
        throw new Error(`Event handler error in ${componentName}`);
      }
      throw error;
    }
  }) as T;
}

// Helper to debug async handlers
export function debugAsyncHandler(
  name: string,
  handler: (...args: any[]) => Promise<any>
) {
  return async (...args: any[]) => {
    logger.info(`[${name}] Starting async handler`, { 
      argsCount: args.length,
      firstArgType: args[0]?.constructor?.name 
    });
    
    try {
      const result = await handler(...args);
      logger.info(`[${name}] Completed successfully`);
      return result;
    } catch (error) {
      logger.error(`[${name}] Error in handler:`, error);
      
      // If it's an event, provide more context
      if (error && typeof error === 'object' && 'isTrusted' in error) {
        logger.error(`[${name}] Event details:`, {
          type: (error as any).type,
          target: (error as any).target?.tagName,
          currentTarget: (error as any).currentTarget?.tagName,
        });
      }
      
      throw error;
    }
  };
}