import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedQuestions() {
  try {
    // Check if questions already exist
    const existingCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM blind_test_questions
    `;
    
    const count = Number(existingCount[0]?.count || 0);
    
    if (count > 0) {
      console.log(`✓ Questions already seeded (${count} questions found)`);
      return;
    }

    // Seed the questions
    await prisma.$executeRaw`
      INSERT INTO blind_test_questions (question_text, category, difficulty) VALUES
        ('Explain quantum computing to a 10-year-old using a creative analogy', 'creative', 'medium'),
        ('Write a Python function that finds the longest palindromic substring in a given string', 'technical', 'medium'),
        ('What are the ethical implications of AI in healthcare decision-making?', 'reasoning', 'hard'),
        ('Create a haiku about machine learning', 'creative', 'easy'),
        ('Explain the difference between correlation and causation with real-world examples', 'reasoning', 'medium'),
        ('Design a REST API for a social media application. List the main endpoints and their purposes', 'technical', 'hard'),
        ('What would happen if gravity was 10% stronger on Earth?', 'reasoning', 'medium'),
        ('Write a short story (3 sentences) about a robot learning to paint', 'creative', 'easy'),
        ('Debug this code: def factorial(n): return n * factorial(n-1)', 'technical', 'easy'),
        ('How would you explain the concept of democracy to someone from a society that has never had one?', 'reasoning', 'hard')
      ON CONFLICT DO NOTHING
    `;

    const newCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM blind_test_questions
    `;
    
    console.log(`✓ Successfully seeded ${newCount[0].count} questions`);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedQuestions();