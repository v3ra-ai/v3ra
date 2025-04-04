"use server"

import type { VoteResult } from "../lib/types"
import { prisma } from "../lib/db/client"
import { v4 as uuidv4 } from 'uuid'
import { OpenAIValidator } from "@/lib/validators/providers/openai"
import { AnthropicValidator } from "@/lib/validators/providers/anthropic"
import { GrokValidator } from "@/lib/validators/providers/grok"
import { GeminiValidator } from "@/lib/validators/providers/gemini"
import { validatorService } from "@/lib/services/validatorService"

export async function broadcastCustomQuery(query: string) {
  try {
    console.log("Processing custom query:", query)

    // Get all active validators from the database
    const dbValidators = await validatorService.getActiveValidators()

    if (!dbValidators || dbValidators.length === 0) {
      console.warn("No active validators found in the database")
      return { error: "No active validators found" }
    }

    console.log(`Found ${dbValidators.length} active validators in the registry`)

    // Create session ID for this vote
    const sessionId = uuidv4()

    // Create a vote session in the database
    const voteSession = await prisma.voteSession.create({
      data: {
        id: sessionId,
        queryText: query,
        isConsensusReached: false, // Will be updated after votes are collected
        timestamp: new Date(),
        votesYes: 0,
        votesNo: 0,
        notVoted: 0,
      }
    })

    // Initialize arrays to collect validator responses
    const validatorResponsePromises = []

    // For each validator, send the query and collect responses
    for (const dbValidator of dbValidators) {
      // Create validator instance based on provider
      let validator

      if (dbValidator.provider === "OpenAI") {
        validator = new OpenAIValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          active: dbValidator.active
        })
      } else if (dbValidator.provider === "Anthropic") {
        console.log(`Creating Anthropic validator instance for ${dbValidator.id} (${dbValidator.profileName})`)
        validator = new AnthropicValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          active: dbValidator.active
        })
      } else if (dbValidator.provider === "Grok") {
        console.log(`Creating Grok validator instance for ${dbValidator.id} (${dbValidator.profileName})`)
        validator = new GrokValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          active: dbValidator.active
        })
      } else if (dbValidator.provider === "Google") {
        console.log(`Creating Google Gemini validator instance for ${dbValidator.id} (${dbValidator.profileName})`)
        validator = new GeminiValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          active: dbValidator.active
        })
      } else {
        // Skip unsupported validator types
        console.warn(`Validator provider ${dbValidator.provider} not supported yet`)
        continue
      }

      // Process the validation asynchronously
      const validationPromise = validator.validate({
        statement: query
      }).then(async (response) => {
        // Record validator response in database
        await validatorService.recordValidatorResponse({
          validatorId: dbValidator.id,
          voteSessionId: sessionId,
          vote: response.vote,
          rationale: response.rationale,
          confidence: response.confidence,
          latency: response.latency,
          error: response.error
        })

        // Return response for UI processing
        return {
          id: dbValidator.id,
          provider: dbValidator.provider,
          profileName: dbValidator.profileName,
          vote: response.vote ? "YES" : "NO",
          rationale: response.rationale
        }
      }).catch(error => {
        console.error(`Error processing validator ${dbValidator.id}:`, error)
        return {
          id: dbValidator.id,
          provider: dbValidator.provider,
          profileName: dbValidator.profileName,
          vote: "ERROR",
          rationale: `Error: ${error.message}`
        }
      })

      validatorResponsePromises.push(validationPromise)
    }

    // Wait for all validator responses to complete
    const validatorResponses = await Promise.all(validatorResponsePromises)

    // Calculate voting results
    const yesVotes = validatorResponses.filter(r => r.vote === "YES").length
    const noVotes = validatorResponses.filter(r => r.vote === "NO").length
    const notVoted = validatorResponses.filter(r => r.vote === "ERROR").length

    // Determine consensus
    const totalValidVotes = yesVotes + noVotes
    const isConsensusReached = totalValidVotes > 0
    const consensusValue = totalValidVotes > 0 ? (yesVotes > noVotes) : null

    // Update vote session with results
    await prisma.voteSession.update({
      where: { id: sessionId },
      data: {
        isConsensusReached,
        consensusValue,
        votesYes: yesVotes,
        votesNo: noVotes,
        notVoted,
        updatedAt: new Date()
      }
    })

    // Return vote result for the UI
    const result: VoteResult = {
      id: sessionId,
      isConsensusReached,
      consensusValue,
      queryText: voteSession.queryText, // removed "query", us if needed
      validatorResponses,
      votingResult: {
        yes: yesVotes,
        no: noVotes,
        notVoted
      },
      timestamp: new Date().toISOString()
    }

    return result
  } catch (error) {
    console.error("Error broadcasting custom query:", error)
    return { error: (error as Error).message }
  }
}
