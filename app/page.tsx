// app/page.tsx
import { redirect } from 'next/navigation';

export default async function Home({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const isDev = process.env.NODE_ENV === 'development';
  const mode = params.mode;

  // http://localhost:3000/?mode=ask
  if (isDev && mode === 'ask') {
    redirect('/ask');
  } else {
    redirect('/explorer');
  }
}