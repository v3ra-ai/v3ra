import { prisma } from "../lib/db/client";
import { StatementNormalizer } from "../lib/truth-market/statement-normalizer";

/**
 * Migration script to convert existing VoteSession data to Truth Market format
 * 
 * Run with: npx tsx scripts/migrate-to-truth-market.ts
 */

async function migrateVoteSessions() {
  console.log("Starting Truth Market migration...");
  
  try {
    // Get all existing vote sessions
    const sessions = await prisma.voteSession.findMany({
      where: {
        statement: null // Only migrate sessions that haven't been converted
      },
      include: {
        ValidatorResponse: true
      },
      take: 1000 // Process in batches
    });
    
    console.log(`Found ${sessions.length} sessions to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const session of sessions) {
      try {
        // Normalize the query text to a statement
        const normalized = StatementNormalizer.normalize(session.queryText);
        
        // Calculate probability from YES/NO votes
        const totalVotes = session.votesYes + session.votesNo;
        const probability = totalVotes > 0 
          ? Math.round((session.votesYes / totalVotes) * 100)
          : 50;
        
        // Calculate average confidence from validator responses
        const avgConfidence = session.ValidatorResponse.length > 0
          ? Math.round(
              session.ValidatorResponse.reduce((sum, r) => 
                sum + (r.confidence || 0.5), 0
              ) / session.ValidatorResponse.length * 100
            )
          : 50;
        
        // Determine consensus strength
        let consensusStrength: 'STRONG' | 'MODERATE' | 'WEAK' = 'MODERATE';
        if (session.isConsensusReached && avgConfidence > 70) {
          consensusStrength = 'STRONG';
        } else if (!session.isConsensusReached || avgConfidence < 40) {
          consensusStrength = 'WEAK';
        }
        
        // Update the session
        await prisma.voteSession.update({
          where: { id: session.id },
          data: {
            statement: normalized.statement,
            context: normalized.context,
            probability: probability,
            averageConfidence: avgConfidence,
            consensusStrength: consensusStrength
          }
        });
        
        // Create MarketPosition records from ValidatorResponses
        for (const response of session.ValidatorResponse) {
          const position = response.vote === 'YES' ? 'YES' :
                          response.vote === 'NO' ? 'NO' : 'UNCERTAIN';
          
          await prisma.$executeRaw`
            INSERT INTO "MarketPosition" 
            ("id", "sessionId", "validatorId", "position", "confidence", "reasoning", "responseTime", "createdAt")
            VALUES (
              gen_random_uuid(),
              ${session.id},
              ${response.validatorId},
              ${position},
              ${Math.round((response.confidence || 0.5) * 100)},
              ${response.rationale},
              ${response.latency || 0},
              ${response.createdAt}
            )
            ON CONFLICT ("sessionId", "validatorId") DO NOTHING
          `;
        }
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`Migrated ${successCount} sessions...`);
        }
        
      } catch (error) {
        console.error(`Error migrating session ${session.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nMigration complete!`);
    console.log(`✅ Successfully migrated: ${successCount} sessions`);
    console.log(`❌ Errors: ${errorCount} sessions`);
    
    // Update validator calibration scores based on historical data
    console.log("\nCalculating validator calibration scores...");
    await updateValidatorCalibration();
    
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function updateValidatorCalibration() {
  const validators = await prisma.validator.findMany({
    where: { active: true }
  });
  
  for (const validator of validators) {
    // Get validator's historical predictions
    const responses = await prisma.validatorResponse.findMany({
      where: { 
        validatorId: validator.id,
        matchedConsensus: { not: null }
      },
      select: {
        confidence: true,
        matchedConsensus: true
      },
      take: 1000
    });
    
    if (responses.length === 0) continue;
    
    // Calculate calibration score
    // Group by confidence buckets and check accuracy
    const buckets: Record<number, { correct: number; total: number }> = {};
    
    responses.forEach(r => {
      const confidence = Math.round((r.confidence || 0.5) * 10) * 10; // Round to nearest 10
      if (!buckets[confidence]) {
        buckets[confidence] = { correct: 0, total: 0 };
      }
      buckets[confidence].total++;
      if (r.matchedConsensus) buckets[confidence].correct++;
    });
    
    // Calculate calibration error
    let calibrationError = 0;
    let bucketCount = 0;
    
    Object.entries(buckets).forEach(([conf, stats]) => {
      const expectedAccuracy = parseInt(conf) / 100;
      const actualAccuracy = stats.correct / stats.total;
      calibrationError += Math.abs(expectedAccuracy - actualAccuracy);
      bucketCount++;
    });
    
    const calibrationScore = bucketCount > 0 
      ? Math.max(0, 1 - (calibrationError / bucketCount))
      : 0.5;
    
    await prisma.validator.update({
      where: { id: validator.id },
      data: {
        calibrationScore: parseFloat(calibrationScore.toFixed(4))
      }
    });
    
    console.log(`Updated calibration for ${validator.profileName}: ${calibrationScore.toFixed(4)}`);
  }
}

// Run the migration
migrateVoteSessions().catch(console.error);