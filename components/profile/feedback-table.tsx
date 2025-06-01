import { Feedback } from '@/lib/types';
import { MessageCirclePlus } from 'lucide-react';
import Link from 'next/link';

interface FeedbackTableProps {
  feedback: Feedback[];
}

export default function FeedbackTable({ feedback }: FeedbackTableProps) {
  if (feedback.length === 0) {
    return (
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <MessageCirclePlus className="w-6 h-6 mr-2 text-zinc-800 dark:text-zinc-200" />
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            Your Feedback
          </h2>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">
          No feedback submitted yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center mb-4">
        <MessageCirclePlus className="w-6 h-6 mr-2 text-zinc-800 dark:text-zinc-200" />
        <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
          Your Feedback
        </h2>
      </div>
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
            {feedback.slice(0, 20).map((item, index) => {
              // Extract vote_session_id from url, explanation, or action
              const voteSessionIdMatch = item.url?.match(/\/ask\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i) ||
                item.url?.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i) ||
                item.explanation?.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i) ||
                item.action?.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
              const voteSessionId = voteSessionIdMatch ? voteSessionIdMatch[1] : null;
              if (!voteSessionId) {
                console.warn('Feedback missing valid vote_session_id:', {
                  id: item.id,
                  url: item.url,
                  action: item.action,
                  explanation: item.explanation,
                  options: item.options,
                  component: item.component,
                });
              }

              return (
                <tr
                  key={`${item.action}-${index}`}
                  className="border-t border-zinc-200 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {item.username}
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {item.rating === 'thumbs_up' ? '👍 Thumbs Up' : '👎 Thumbs Down'}
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {item.explanation || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {item.component}
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {item.options && item.options.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.options.map((option) => (
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
                    {voteSessionId ? (
                      <Link
                        href={`/ask/${voteSessionId}`}
                        className="text-blue-500 hover:underline dark:text-blue-400 cursor-pointer"
                      >
                        /ask/{voteSessionId}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}