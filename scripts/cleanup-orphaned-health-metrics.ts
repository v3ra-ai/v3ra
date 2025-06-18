#!/usr/bin/env ts-node
/**
 * Cleanup orphaned LLM health metrics
 * This script removes health metrics for models that no longer have active validators
 * Safe to run in production - only removes orphaned data
 */

const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function cleanupOrphanedHealthMetrics() {
  console.log('Starting cleanup of orphaned LLM health metrics...\n');

  try {
    // Step 1: Get all active validators
    const activeValidators = await prisma.validator.findMany({
      where: { active: true },
      select: { provider: true, modelName: true }
    });

    console.log(`Found ${activeValidators.length} active validators`);

    // Step 2: Create a set of active provider:model combinations
    const activeModels = new Set(
      activeValidators.map((v: any) => `${v.provider}:${v.modelName}`)
    );

    console.log(`Active models: ${Array.from(activeModels).join(', ')}\n`);

    // Step 3: Get all health metrics
    const allHealthMetrics = await prisma.lLMHealthMetric.findMany();
    console.log(`Found ${allHealthMetrics.length} total health metrics`);

    // Step 4: Identify orphaned metrics
    const orphanedMetrics = allHealthMetrics.filter((metric: any) => {
      const key = `${metric.providerName}:${metric.modelName}`;
      return !activeModels.has(key);
    });

    console.log(`\nFound ${orphanedMetrics.length} orphaned health metrics:`);
    orphanedMetrics.forEach((metric: any) => {
      console.log(`  - ${metric.providerName}/${metric.modelName} (status: ${metric.status})`);
    });

    if (orphanedMetrics.length === 0) {
      console.log('\nNo orphaned metrics found. System is clean!');
      return;
    }

    // Step 5: Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete the orphaned health metrics listed above.');
    console.log('This action cannot be undone.');
    console.log('\nTo proceed, set DRY_RUN=false in your environment or run with --force flag');

    const isDryRun = process.env.DRY_RUN !== 'false' && !process.argv.includes('--force');

    if (isDryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made');
      console.log('Run with DRY_RUN=false or --force flag to execute cleanup');
      return;
    }

    // Step 6: Delete orphaned metrics
    console.log('\n🗑️  Deleting orphaned metrics...');
    
    for (const metric of orphanedMetrics) {
      await prisma.lLMHealthMetric.delete({
        where: { id: metric.id }
      });
      console.log(`  ✓ Deleted ${metric.providerName}/${metric.modelName}`);
    }

    // Step 7: Also cleanup any related health probes
    console.log('\n🧹 Cleaning up related health probes...');
    
    for (const metric of orphanedMetrics) {
      const deletedProbes = await prisma.lLMHealthProbe.deleteMany({
        where: {
          providerName: metric.providerName,
          modelName: metric.modelName
        }
      });
      if (deletedProbes.count > 0) {
        console.log(`  ✓ Deleted ${deletedProbes.count} probes for ${metric.providerName}/${metric.modelName}`);
      }
    }

    console.log('\n✅ Cleanup completed successfully!');

    // Step 8: Show final state
    const remainingMetrics = await prisma.lLMHealthMetric.count();
    console.log(`\nFinal state: ${remainingMetrics} health metrics remaining`);

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupOrphanedHealthMetrics();