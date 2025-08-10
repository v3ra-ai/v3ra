import { prisma } from '../lib/db/client';

async function checkAnalytics() {
  try {
    // Check blind_test_analytics table
    const analytics = await prisma.$queryRaw`
      SELECT 
        model_id,
        SUM(wins) as total_wins,
        SUM(losses) as total_losses,
        AVG(win_rate) as overall_win_rate,
        AVG(avg_time_to_decide) as avg_decision_time
      FROM blind_test_analytics
      WHERE model_id IN ('gpt-4o', 'gpt-5')
      GROUP BY model_id
    `;
    
    console.log('Analytics data:', analytics);
    
    // Check blind_test_sessions
    const sessions = await prisma.$queryRaw`
      SELECT COUNT(*) as total_sessions, 
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions
      FROM blind_test_sessions
      WHERE session_type = 'gpt_comparison'
    `;
    
    console.log('Sessions:', sessions);
    
    // Check blind_test_votes
    const votes = await prisma.$queryRaw`
      SELECT selected_model_id, COUNT(*) as vote_count
      FROM blind_test_votes
      GROUP BY selected_model_id
    `;
    
    console.log('Votes by model:', votes);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAnalytics();