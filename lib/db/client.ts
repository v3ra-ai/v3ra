import { PrismaClient } from "@prisma/client"

// Ensure DATABASE_URL is set for Prisma
// Prefer non-pooled connection for better compatibility
if (!process.env.DATABASE_URL) {
  if (process.env.POSTGRES_URL_NON_POOLING) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING;
  } else if (process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
  } else if (process.env.POSTGRES_PRISMA_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
  }
}

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Get the database URL - prefer non-pooled for Prisma
const databaseUrl = process.env.DATABASE_URL || 
                   process.env.POSTGRES_URL_NON_POOLING ||
                   process.env.POSTGRES_URL ||
                   process.env.POSTGRES_PRISMA_URL;

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