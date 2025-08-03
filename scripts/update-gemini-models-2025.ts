import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateGeminiModels2025() {
  console.log('Updating Gemini models to 2025 versions...');

  try {
    // Update gemini-1.5-flash to gemini-2.0-flash
    const flash = await prisma.ai_models.updateMany({
      where: {
        OR: [
          { model_path: 'google/gemini-1.5-flash' },
          { model_path: { contains: 'gemini-1.5-flash' } }
        ]
      },
      data: {
        model_path: 'google/gemini-2.0-flash',
        name: 'Gemini 2.0 Flash'
      }
    });
    console.log(`Updated ${flash.count} flash models to gemini-2.0-flash`);

    // Update gemini-1.5-pro to gemini-2.5-pro
    const pro = await prisma.ai_models.updateMany({
      where: {
        OR: [
          { model_path: 'google/gemini-1.5-pro' },
          { model_path: { contains: 'gemini-1.5-pro' } }
        ]
      },
      data: {
        model_path: 'google/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro'
      }
    });
    console.log(`Updated ${pro.count} pro models to gemini-2.5-pro`);

    // Check current Google models
    const googleModels = await prisma.ai_models.findMany({
      where: {
        provider: 'Google'
      },
      select: {
        id: true,
        name: true,
        model_path: true
      }
    });
    
    console.log('\nCurrent Google models after update:');
    googleModels.forEach(m => console.log(`  - ${m.name}: ${m.model_path}`));

    console.log('\n✅ Gemini models updated to 2025 versions!');
    console.log('Note: gemini-1.5-* models have limited availability starting April 2025');
  } catch (error) {
    console.error('Error updating models:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGeminiModels2025();