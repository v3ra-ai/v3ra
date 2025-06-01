import { Favorite } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Star } from 'lucide-react';
import { formatDateTimeCards } from '@/utils/date-utils';
import Link from 'next/link';

interface FavoritesTableProps {
  favorites: Array<Favorite & { queryText?: string }>;
}

export default function FavoritesTable({ favorites }: FavoritesTableProps) {
  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center mb-4">
        <Star className="w-6 h-6 mr-2 text-zinc-800 dark:text-zinc-200" />
        <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
          Your Favorites
        </h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-zinc-600 dark:text-zinc-400">Query</TableHead>
              <TableHead className="text-zinc-600 dark:text-zinc-400">Added On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {favorites.slice(0, 20).map((favorite) => (
              <TableRow key={favorite.id}>
                <TableCell className="text-zinc-800 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-[400px]">
                  <Link
                    href={`/ask/${favorite.vote_session_id}`}
                    className="text-zinc-800 dark:text-zinc-200 hover:underline cursor-pointer"
                  >
                    {favorite.queryText || favorite.vote_session_id}
                  </Link>
                </TableCell>
                <TableCell className="text-zinc-800 dark:text-zinc-200">
                  {formatDateTimeCards(favorite.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}