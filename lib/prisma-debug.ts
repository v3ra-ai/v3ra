import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Type for valid Prisma model names (adjust based on your schema)
type ModelNames = keyof PrismaClient;

// Type for Prisma delegate methods (e.g., findMany, findUnique)
type DelegateMethods<T extends ModelNames> = keyof PrismaClient[T];

// Wrapper to debug Prisma queries with call stack
const debugPrisma = new Proxy(prisma, {
  get(target: PrismaClient, model: ModelNames) {
    if (typeof model === 'string' && model in target) {
      return new Proxy(target[model], {
        get(targetModel: PrismaClient[ModelNames], method: DelegateMethods<ModelNames>) {
            if (typeof method === 'string' && typeof targetModel[method] === 'function') {
            return async (...args: unknown[]) => {
              // Capture call stack
              const stack = new Error().stack?.split('\n').slice(2).join('\n') || 'No stack trace';
              console.log(`Prisma query for ${model}.${method}:\nCall stack:\n${stack}`);
              // Execute original query with proper typing
              const fn = targetModel[method] as (...fnArgs: unknown[]) => unknown;
              return fn(...args);
            };
            }
          return targetModel[method];
        },
      });
    }
    return target[model];
  },
}) as PrismaClient;

export default debugPrisma;