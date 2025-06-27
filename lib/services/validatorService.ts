import { prisma } from "@/lib/db/client";
import { Validator, ValidatorKey } from "@prisma/client";
import { AIValidator } from "@/lib/types";

type DbValidatorWithKeys = Validator & { apiKeys: ValidatorKey[] };

class ValidatorService {
  async getActiveValidators(): Promise<Validator[]> {
    try {
      return await prisma.validator.findMany({
        where: { active: true },
        orderBy: { createdAt: "asc" },
      });
    } catch {
      return [];
    }
  }

  async getActiveDbValidators(): Promise<DbValidatorWithKeys[]> {
    try {
      return await prisma.validator.findMany({
        where: { active: true },
        include: {
          apiKeys: true,
        },
        orderBy: { createdAt: "asc" },
      });
    } catch {
      return [];
    }
  }

  async getValidatorById(id: string): Promise<Validator | null> {
    try {
      return await prisma.validator.findUnique({
        where: { id },
      });
    } catch {
      return null;
    }
  }

  async updateValidator(id: string, data: Partial<Validator>): Promise<Validator | null> {
    try {
      return await prisma.validator.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  }

  async recordValidatorResponse(data: {
    validatorId: string;
    voteSessionId: string;
    vote: boolean;
    rationale: string;
    responseTime?: number;
    confidence?: number;
    latency?: number;
    error?: string;
  }): Promise<void> {
    try {
      await prisma.validatorResponse.create({
        data: {
          vote: data.vote ? "YES" : "NO",
          rationale: data.rationale,
          confidence: data.confidence,
          latency: data.latency,
          error: data.error,
          voteSessionId: data.voteSessionId,
          validatorId: data.validatorId,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async addValidator(validator: AIValidator): Promise<AIValidator> {
    try {
      // In a real implementation, this would add the validator to the database
      // For now, just log it and return the validator
      return validator;
    } catch (err) {
      throw err;
    }
  }

  async removeValidator(_id: string): Promise<boolean> {
    try {
      // In a real implementation, this would remove the validator from the database
      return true;
    } catch {
      return false;
    }
  }

  async getAllValidators(): Promise<DbValidatorWithKeys[]> {
    try {
      return await prisma.validator.findMany({
        include: {
          apiKeys: true,
        },
        orderBy: { createdAt: "asc" },
      });
    } catch {
      return [];
    }
  }

  async toggleValidator(id: string, active: boolean): Promise<boolean> {
    try {
      await prisma.validator.update({
        where: { id },
        data: { active },
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const validatorService = new ValidatorService();