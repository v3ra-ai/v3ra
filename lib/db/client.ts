import { PrismaClient } from "@prisma/client"

// Get the database URL - prefer non-pooled for Prisma
const databaseUrl = process.env.DATABASE_URL || 
                   process.env.POSTGRES_URL_NON_POOLING ||
                   process.env.POSTGRES_URL ||
                   process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  throw new Error('No database URL found. Please set DATABASE_URL, POSTGRES_URL_NON_POOLING, POSTGRES_URL, or POSTGRES_PRISMA_URL');
}

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["error"],
    // Optimize for serverless
    errorFormat: 'pretty',
    transactionOptions: {
      timeout: 10000, // 10 seconds
    },
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

if (process.env.NODE_ENV !== "production") global.prisma = prisma