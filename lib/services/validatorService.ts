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
    } catch (error) {
      console.error("Error fetching active validators:", error);
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
    } catch (error) {
      console.error("Error fetching active validators with keys:", error);
      return [];
    }
  }

  async getValidatorById(id: string): Promise<Validator | null> {
    try {
      return await prisma.validator.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error("Error fetching validator by id:", error);
      return null;
    }
  }

  async updateValidator(id: string, data: Partial<Validator>): Promise<Validator | null> {
    try {
      return await prisma.validator.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error("Error updating validator:", error);
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
      // In a real implementation, this would record the response in the database
      // For now, just log it
      console.log("Recording validator response:", data);
    } catch (error) {
      console.error("Error recording validator response:", error);
    }
  }

  async addValidator(validator: AIValidator): Promise<AIValidator> {
    try {
      // In a real implementation, this would add the validator to the database
      // For now, just log it and return the validator
      console.log("Adding validator:", validator.name);
      return validator;
    } catch (error) {
      console.error("Error adding validator:", error);
      throw error;
    }
  }

  async removeValidator(id: string): Promise<boolean> {
    try {
      // In a real implementation, this would remove the validator from the database
      console.log("Removing validator:", id);
      return true;
    } catch (error) {
      console.error("Error removing validator:", error);
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
    } catch (error) {
      console.error("Error fetching all validators:", error);
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
    } catch (error) {
      console.error("Error toggling validator:", error);
      return false;
    }
  }
}

export const validatorService = new ValidatorService();