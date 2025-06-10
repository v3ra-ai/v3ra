import { PrismaClient } from '@prisma/client'
import { allValidatorModels } from './validator-models'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting to safely add validators...')
  
  // Get existing validators
  const existingValidators = await prisma.validator.findMany()
  console.log(`Found ${existingValidators.length} existing validators`)
  
  // Create a map of existing validator model IDs to avoid duplicates
  // Using modelName+provider as a unique key since that's what identifies a specific model
  const existingModelMap = new Map()
  existingValidators.forEach(validator => {
    const key = `${validator.provider}-${validator.modelName}`
    existingModelMap.set(key, validator)
  })
  
  // Track stats
  let added = 0
  let skipped = 0
  
  // Add only validators that don't exist yet
  for (const model of allValidatorModels) {
    const key = `${model.provider}-${model.model_id}`
    
    if (existingModelMap.has(key)) {
      console.log(`Skipping existing ${model.name} from ${model.provider}`)
      skipped++
      continue
    }
    
    // Add new validator
    await prisma.validator.create({
      data: {
        profileName: `${model.name} Validator`,
        provider: model.provider,
        modelName: model.model_id,
        publicKey: `${model.provider}-${model.model_id}-pubkey`,
        active: true,
        description: `${model.name} validator powered by ${model.provider}`,
        avatarUrl: model.icon || null,
        validatorType: 'LLM',
        reliability: 0.95,
        totalVotes: 0,
        correctVotes: 0,
      }
    })
    console.log(`Added ${model.name} from ${model.provider}`)
    added++
  }
  
  const count = await prisma.validator.count()
  console.log(`✅ Operation complete: ${added} validators added, ${skipped} skipped`)
  console.log(`✅ Database now has ${count} total validators`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
