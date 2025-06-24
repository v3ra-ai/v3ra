import { PrismaClient } from "@prisma/client"
import './database-url'; // Ensure DATABASE_URL is set

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
  })

if (process.env.NODE_ENV !== "production") global.prisma = prisma