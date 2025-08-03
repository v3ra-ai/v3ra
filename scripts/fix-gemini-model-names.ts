import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixGeminiModels() {
  console.log('Fixing Gemini model names...');

  try {
    // Fix gemini-2.5-flash to gemini-1.5-flash
    const flash = await prisma.ai_models.updateMany({
      where: {
        OR: [
          { model_path: 'google/gemini-2.5-flash' },
          { model_path: 'google/gemini-flash' }
        ]
      },
      data: {
        model_path: 'google/gemini-1.5-flash'
      }
    });
    console.log(`Updated ${flash.count} flash models`);

    // Fix gemini-2.5-pro to gemini-1.5-pro
    const pro = await prisma.ai_models.updateMany({
      where: {
        model_path: 'google/gemini-2.5-pro'
      },
      data: {
        model_path: 'google/gemini-1.5-pro'
      }
    });
    console.log(`Updated ${pro.count} pro models`);

    // Also check which Google models we have
    const googleModels = await prisma.ai_models.findMany({
      where: {
        provider: 'Google'
      },
      select: {
        name: true,
        model_path: true
      }
    });
    console.log('\nCurrent Google models:');
    googleModels.forEach(m => console.log(`  - ${m.name}: ${m.model_path}`));

    console.log('✅ Gemini models fixed!');
  } catch (error) {
    console.error('Error fixing models:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGeminiModels();