import { createSupabaseServerClient } from '@/lib/supabase-client';
import { VoteResult } from '@/lib/types';
import { notFound } from 'next/navigation';
import AskResultsStandardCard from '@/components/ask/ask-results-standard-card';

// Type matching VoteSession schema
interface VoteSession {
  id: string;
  query_text: string | null;
  is_consensus_reached: boolean;
  consensus_value: boolean | null;
  validator_responses:
    | { id: string; provider: string; profile_name: string; vote: string; rationale: string }[]
    | null;
  timestamp: string | number | undefined;
  votes_yes: number | null;
  votes_no: number | null;
  not_voted: number | null;
}

export async function generateMetadata({ params }: { params: Promise<{ cardId: string }> }) {
  const resolvedParams = await params;
  const cardId = resolvedParams.cardId;

  if (!cardId) {
    console.error('Invalid cardId in generateMetadata:', cardId);
    return { title: 'Card Not Found' };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('vote_sessions')
    .select('id, query_text, is_consensus_reached, consensus_value, validator_responses, votes_yes, votes_no, not_voted')
    .eq('id', cardId)
    .single();

  if (error || !data) {
    console.error('Error fetching vote session for metadata:', error?.message || 'No data');
    return { title: 'Card Not Found' };
  }

  const typedData = data as VoteSession;

  // Validate required fields
  if (!typedData.id || !typedData.query_text) {
    console.error('Invalid vote session data for metadata:', {
      id: typedData.id,
      query_text: typedData.query_text,
    });
    return { title: 'Card Not Found' };
  }

  const card: VoteResult = {
    id: typedData.id,
    queryText: typedData.query_text,
    isConsensusReached: typedData.is_consensus_reached,
    consensusValue: typedData.consensus_value,
    validatorResponses: (typedData.validator_responses || []).map((res) => ({
      id: res.id || 'unknown',
      provider: res.provider || 'Unknown',
      profileName: res.profile_name || 'Unknown',
      vote: res.vote || 'UNKNOWN',
      rationale: res.rationale || '',
    })),
    votingResult: {
      yes: typedData.votes_yes || 0,
      no: typedData.votes_no || 0,
      notVoted: typedData.not_voted || 0,
    },
  };

  const ogImageUrl = `https://your-site.com/api/og?cardId=${cardId}`;
  const description = `Truth Report Card: ${
    card.isConsensusReached ? (card.consensusValue ? 'True' : 'False') : 'No Consensus'
  }`;

  return {
    title: card.queryText,
    openGraph: {
      title: card.queryText,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      url: `https://your-site.com/ask/${cardId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: card.queryText,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const resolvedParams = await params;
  const cardId = resolvedParams.cardId;

  if (!cardId) {
    console.error('Invalid cardId in CardPage:', cardId);
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('vote_sessions')
    .select('id, query_text, is_consensus_reached, consensus_value, validator_responses, timestamp, votes_yes, votes_no, not_voted')
    .eq('id', cardId)
    .single();

  if (error || !data) {
    console.error('Error fetching vote session:', error?.message || 'No data');
    notFound();
  }

  const typedData = data as VoteSession;

  // Validate required fields
  if (!typedData.id || !typedData.query_text) {
    console.error('Invalid vote session data:', {
      id: typedData.id,
      query_text: typedData.query_text,
    });
    notFound();
  }

  const card: VoteResult = {
    id: typedData.id,
    queryText: typedData.query_text,
    isConsensusReached: typedData.is_consensus_reached,
    consensusValue: typedData.consensus_value,
    validatorResponses: (typedData.validator_responses || []).map((res) => ({
      id: res.id || 'unknown',
      provider: res.provider || 'Unknown',
      profileName: res.profile_name || 'Unknown',
      vote: res.vote || 'UNKNOWN',
      rationale: res.rationale || '',
    })),
    votingResult: {
      yes: typedData.votes_yes || 0,
      no: typedData.votes_no || 0,
      notVoted: typedData.not_voted || 0,
    },
    timestamp: typedData.timestamp,
  };

  return (
    <div className="container mx-auto p-4">
      <AskResultsStandardCard
        query={card}
        layoutMode="row"
        isOpen={false}
        toggleItem={() => {}}
      />
    </div>
  );
}