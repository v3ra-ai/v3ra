import { PrismaClient as PrismaClientSqlite } from '../node_modules/.prisma/client-sqlite';
import { PrismaClient } from '@prisma/client';

const sqlitePrisma = new PrismaClientSqlite();
const pgPrisma = new PrismaClient();

async function migrate() {
  try {
    const validators = await sqlitePrisma.validator.findMany();
    for (const v of validators) {
      await pgPrisma.validator.create({ data: v });
    }
    console.log(`Migrated ${validators.length} validators`);

    const voteSessions = await sqlitePrisma.voteSession.findMany();
    for (const vs of voteSessions) {
      await pgPrisma.voteSession.create({ data: vs });
    }
    console.log(`Migrated ${voteSessions.length} vote sessions`);

    const apiKeys = await sqlitePrisma.apiKey.findMany();
    for (const ak of apiKeys) {
      await pgPrisma.apiKey.create({ data: ak });
    }
    console.log(`Migrated ${apiKeys.length} api keys`);

    const validatorKeys = await sqlitePrisma.validatorKey.findMany();
    for (const vk of validatorKeys) {
      await pgPrisma.validatorKey.create({ data: vk });
    }
    console.log(`Migrated ${validatorKeys.length} validator keys`);

    const validatorResponses = await sqlitePrisma.validatorResponse.findMany();
    for (const vr of validatorResponses) {
      await pgPrisma.validatorResponse.create({ data: vr });
    }
    console.log(`Migrated ${validatorResponses.length} validator responses`);

    const graphEdges = await sqlitePrisma.graphEdge.findMany();
    for (const ge of graphEdges) {
      await pgPrisma.graphEdge.create({ data: ge });
    }
    console.log(`Migrated ${graphEdges.length} graph edges`);

    const threads = await sqlitePrisma.thread.findMany();
    for (const t of threads) {
      await pgPrisma.thread.create({ data: t });
    }
    console.log(`Migrated ${threads.length} threads`);

    const replies = await sqlitePrisma.reply.findMany();
    for (const r of replies) {
      await pgPrisma.reply.create({ data: r });
    }
    console.log(`Migrated ${replies.length} replies`);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await sqlitePrisma.$disconnect();
    await pgPrisma.$disconnect();
  }
}

migrate();