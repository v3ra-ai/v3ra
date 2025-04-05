import { PrismaClient, Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { Validator, VoteResult } from './types';

// Type definitions
type GraphEdgeCreateInput = {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationship: string;
  weight?: number | null;
  properties: string;
  validatorId?: string | null;
  voteSessionId?: string | null;
};

type SearchResult = {
  id: string;
  vote: string;
  rationale: string;
  voteSessionId: string;
  queryText: string;
  consensusValue: string;
  timestamp: Date;
  profileName: string;
  provider: string;
  distance: number;
};

// Initialize Prisma client
export const prisma = new PrismaClient();

// Initialize OpenAI client for embeddings
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Initialize database and ensure required extensions
export async function initDatabase(): Promise<boolean> {
  try {
    // Create any necessary extensions (pgvector should be enabled in the schema)
    console.log('Initializing database connection...');
    await prisma.$connect();
    console.log('Database connection established');

    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Seed initial validators if the DB is empty
export async function seedValidators(validators: Validator[]): Promise<void> {
  // Check if validators already exist
  const count = await prisma.validator.count();
  if (count > 0) {
    console.log('Validators already exist, skipping seed');
    return;
  }

  try {
    // Seed validators
    for (const validator of validators) {
      await prisma.validator.create({
        data: {
          profileName: validator.profileName,
          provider: validator.provider,
          publicKey: validator.publicKey,
          isLeader: validator.isLeader || false,
          modelName: validator.modelName || "" // add new
        },
      });
    }
    console.log(`Seeded ${validators.length} validators successfully`);
  } catch (error) {
    console.error('Failed to seed validators:', error);
  }
}

// Generate embeddings for a given text using OpenAI
export async function getEmbeddingForText(text: string): Promise<number[] | null> {
  try {
    if (!openai || !process.env.OPENAI_API_KEY) {
      console.warn('No OpenAI API key found, returning simulated embeddings');
      // Return simulated embedding (dimensionality should match your pgvector setup)
      return Array(1536).fill(0).map(() => Math.random() - 0.5);
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return null;
  }
}

// Store embeddings for a validator response
export async function storeEmbeddingsInVectorDB(
  embedding: number[],
  validatorResponseId: string
): Promise<boolean> {
  try {
    if (!embedding) return false;

    // Update the ValidatorResponse with the embedding
    await prisma.validatorResponse.update({
      where: { id: validatorResponseId },
      data: {
        rationaleEmbedding: JSON.stringify(embedding),
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to store embedding:', error);
    return false;
  }
}

// Create a graph edge between entities
export async function createGraphEdge(
  sourceType: string,
  sourceId: string,
  targetType: string,
  targetId: string,
  relationship: string,
  weight?: number,
  properties?: string
): Promise<boolean> {
  try {
    // Determine which optional foreign keys to set based on entity types
    const data: GraphEdgeCreateInput = {
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationship,
      weight: weight ?? null,
      properties: properties || '',
    };

    // Set optional relations for easier querying
    if (sourceType === 'Validator') {
      data.validatorId = sourceId;
    } else if (sourceType === 'VoteSession') {
      data.voteSessionId = sourceId;
    }

    if (targetType === 'Validator') {
      data.validatorId = targetId;
    } else if (targetType === 'VoteSession') {
      data.voteSessionId = targetId;
    }

    await prisma.graphEdge.create({ data });
    return true;
  } catch (error) {
    console.error('Failed to create graph edge:', error);
    return false;
  }
}

// Persist vote session with validator responses and generate embeddings
export async function persistVoteSession(
  voteResult: VoteResult,
  query: string,
  validators: Validator[]
): Promise<boolean> {
  // Use a transaction to ensure all operations succeed or fail together
  try {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create VoteSession record
      const voteSession = await tx.voteSession.create({
        data: {
          queryText: query,
          isConsensusReached: voteResult.isConsensusReached,
          consensusValue: voteResult.consensusValue,
          votesYes: voteResult.votingResult.yes,
          votesNo: voteResult.votingResult.no,
          notVoted: voteResult.votingResult.notVoted,
          leaderId: validators.find(v => v.isLeader)?.id,
        },
      });

      // 2. Create ValidatorResponse records for each response
      for (const response of voteResult.validatorResponses) {
        // Find the validator in our database
        const validator = await tx.validator.findFirst({
          where: {
            OR: [
              { publicKey: response.id },
              { provider: response.provider, profileName: response.profileName }
            ]
          },
        });

        if (!validator) {
          console.warn(`Validator not found for ${response.profileName} (${response.provider})`);
          continue;
        }

        // Create the validator response
        const validatorResponse = await tx.validatorResponse.create({
          data: {
            vote: response.vote,
            rationale: response.rationale,
            voteSessionId: voteSession.id,
            validatorId: validator.id,
          },
        });

        // 3. Generate and store embeddings (outside transaction to prevent long-running transactions)
        // We'll queue these up to run after the transaction completes
        setTimeout(async () => {
          const embedding = await getEmbeddingForText(response.rationale);
          if (embedding) {
            await storeEmbeddingsInVectorDB(embedding, validatorResponse.id);
          }
        }, 0);

        // 4. Create graph edges
        await tx.graphEdge.create({
          data: {
            sourceType: 'Validator',
            sourceId: validator.id,
            targetType: 'VoteSession',
            targetId: voteSession.id,
            relationship: 'VOTED_IN',
            weight: response.vote.toUpperCase() === 'YES' ? 1 : 0,
            properties: response.rationale.substring(0, 100),  // Changed from object to string

            validatorId: validator.id,
            voteSessionId: voteSession.id,
          },
        });
      }

      return true;
    });
  } catch (error) {
    console.error('Failed to persist vote session:', error);
    return false;
  }
}

// Query vote sessions with semantic search based on a query
export async function searchVoteSessions(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    // Generate embeddings for the search query
    const queryEmbedding = await getEmbeddingForText(query);
    if (!queryEmbedding) {
      return [];
    }

    // Use pgvector to find similar rationales
    // Note: The exact SQL will depend on your PostgreSQL setup
    const results = await prisma.$queryRaw`
      SELECT vr.id, vr.vote, vr.rationale, vr."voteSessionId",
             vs."queryText", vs."consensusValue", vs."timestamp",
             v."profileName", v."provider",
             vr."rationaleEmbedding" <-> ${queryEmbedding}::vector AS distance
      FROM "ValidatorResponse" vr
      JOIN "VoteSession" vs ON vr."voteSessionId" = vs.id
      JOIN "Validator" v ON vr."validatorId" = v.id
      WHERE vr."rationaleEmbedding" IS NOT NULL
      ORDER BY distance
      LIMIT ${limit};
    `;

    // Cast the result to any[] to ensure TypeScript compatibility
    return results as SearchResult[];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Query graph relationships
export async function queryGraphRelationships(
  sourceType: string,
  sourceId: string,
  relationship: string
): Promise<Prisma.GraphEdgeGetPayload<{
  include: {
    validator: true;
    voteSession: true;
  };
}>[]> {
  try {
    const edges = await prisma.graphEdge.findMany({
      where: {
        sourceType,
        sourceId,
        relationship,
      },
      include: {
        validator: true,
        voteSession: true,
      },
    });

    return edges;
  } catch (error) {
    console.error('Failed to query graph relationships:', error);
    return [];
  }
}
