import { prisma } from '@/lib/db/client';
import Navbar from '@/components/ask/navbar/navbar';
import AskFooter from '@/components/ask/ask-footer';
import Link from 'next/link';

interface FeedbackEntry {
  username: string;
  rating: string;
  explanation: string | null;
  component: string;
  action: string;
  options: string[];
}

interface LeaderboardEntry {
  username: string;
  feedbackCount: number;
  latestEntry: Date;
}

async function getFeedback(): Promise<FeedbackEntry[]> {
  try {
    const feedback = await prisma.feedback.findMany({
      select: {
        username: true,
        rating: true,
        explanation: true,
        component: true,
        action: true,
        options: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return feedback;
  } catch (error: unknown) {
    console.error('[FeedbackPage] Error fetching feedback:', error);
    return [];
  }
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const leaderboard = await prisma.feedback.groupBy({
      by: ['username'],
      _count: {
        id: true, // Count feedback entries by id
      },
      _max: {
        createdAt: true,
      },
      orderBy: {
        _count: {
          id: 'desc', // Sort by count of id
        },
      },
      take: 12,
    });
    return leaderboard.map((entry) => ({
      username: entry.username,
      feedbackCount: entry._count?.id ?? 0, // Safe access to _count.id
      latestEntry: entry._max?.createdAt ?? new Date(0), // Safe access to _max.createdAt
    }));
  } catch (error: unknown) {
    console.error('[FeedbackPage] Error fetching leaderboard:', error);
    return [];
  }
}

export default async function FeedbackPage() {
  const feedback = await getFeedback();
  const leaderboard = await getLeaderboard();
  // Static background image (replace with your actual path)
  const backgroundImage = 'url(/path/to/background.jpg)';

  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
      style={{
        backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        width: '100vw',
        height: '100vh',
      }}
    >
      <Navbar />
      <main className="md:mx-[5%] lg:mx-[15%] py-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
          Feedback Leaderboard
        </h1>
        {leaderboard.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">No feedback submitted yet.</p>
        ) : (
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse bg-white dark:bg-zinc-800 rounded-lg shadow">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-700">
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Username
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Feedback Count
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Most Recent Entry
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr
                    key={`${entry.username}-${index}`}
                    className="border-t border-zinc-200 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {entry.username}
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {entry.feedbackCount}
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {new Date(entry.latestEntry).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
          Feedback Submitted
        </h1>
        {feedback.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No feedback submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-zinc-800 rounded-lg shadow">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-700">
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Username
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Rating
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Explanation
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Page
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Options
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((entry, index) => (
                  <tr
                    key={`${entry.action}-${index}`}
                    className="border-t border-zinc-200 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {entry.username}
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {entry.rating === 'thumbs_up' ? '👍 Thumbs Up' : '👎 Thumbs Down'}
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {entry.explanation || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {entry.component}
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {entry.options.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.options.map((option) => (
                            <span
                              key={option}
                              className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200"
                            >
                              {option.replace('_', ' ').toLowerCase()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        'None'
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {entry.component === 'ResultsCard' ? (
                        <Link
                          href={`/ask/${entry.action}`}
                          className="text-blue-500 hover:underline dark:text-blue-400"
                        >
                          /ask/{entry.action}
                        </Link>
                      ) : (
                        entry.action
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <AskFooter />
    </div>
  );
}