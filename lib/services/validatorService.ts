import { PrismaClient, Validator, ValidatorKey } from "@prisma/client";
import { AIValidator } from "../validators/types";
import { dbValidatorToAIValidator } from "../db/validators";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

type DbValidatorWithKeys = Validator & { apiKeys: ValidatorKey[] };

export const validatorService = {
  async getAllValidators(): Promise<DbValidatorWithKeys[]> {
    return prisma.validator.findMany({
      include: { apiKeys: true },
    });
  },

  async getActiveDbValidators(): Promise<DbValidatorWithKeys[]> {
    return prisma.validator.findMany({
      where: { active: true },
      include: { apiKeys: true },
    });
  },

  async addValidator(validator: AIValidator): Promise<AIValidator> {
    const dbValidator = await prisma.validator.create({
      data: {
        profileName: validator.name,
        provider: validator.provider,
        modelName: validator.modelName,
        publicKey: uuidv4(), // Generate a new UUID for publicKey
        active: validator.active ?? true,
        description: validator.description,
        validatorType: validator.validatorType,
        reliability: 0,
        totalVotes: 0,
        correctVotes: 0,
      },
    });

    // Handle keyId if provided (create ValidatorKey record)
    if (validator.keyId) {
      await prisma.validatorKey.create({
        data: {
          id: uuidv4(),
          validatorId: dbValidator.id,
          apiKeyId: validator.keyId,
          createdAt: new Date(),
        },
      });
    }

    return dbValidatorToAIValidator(dbValidator);
  },

  async removeValidator(id: string): Promise<boolean> {
    await prisma.validator.delete({ where: { id } });
    return true;
  },

  async toggleValidator(id: string, active: boolean): Promise<boolean> {
    await prisma.validator.update({
      where: { id },
      data: { active },
    });
    return true;
  },

  async recordValidatorResponse(response: {
    validatorId: string;
    voteSessionId: string;
    vote: boolean;
    rationale: string;
    confidence?: number;
    latency?: number;
    error?: string;
  }): Promise<void> {
    await prisma.validatorResponse.create({
      data: {
        id: uuidv4(),
        validatorId: response.validatorId,
        voteSessionId: response.voteSessionId,
        vote: response.vote ? "YES" : "NO",
        rationale: response.rationale,
        confidence: response.confidence ?? 0.5, // Default if undefined
        latency: response.latency,
        error: response.error,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  },
};