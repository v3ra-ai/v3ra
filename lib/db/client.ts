import { PrismaClient, Prisma } from "@prisma/client"
import { getDatabaseUrl } from "./connection-config"

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Production database configuration
const productionConfig: Prisma.PrismaClientOptions = {
  log: ["error", "warn"],
  errorFormat: 'minimal' as const,
  transactionOptions: {
    timeout: 10000, // 10 seconds
    maxWait: 2000, // 2 seconds
    isolationLevel: 'ReadCommitted' as const,
  },
  // Connection pool settings for production
  datasources: {
    db: {
      url: getDatabaseUrl(), // getDatabaseUrl already handles parameters
    },
  },
};

const developmentConfig: Prisma.PrismaClientOptions = {
  log: ["error", "warn", "info"],
  errorFormat: 'pretty' as const,
  transactionOptions: {
    timeout: 10000,
  },
};

export const prisma =
  global.prisma ||
  new PrismaClient(
    process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig
  )

if (process.env.NODE_ENV !== "production") global.prisma = prisma