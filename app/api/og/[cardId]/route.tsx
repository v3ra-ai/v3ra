import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { VoteResult } from '@/lib/types';
import { OgImage } from '@/components/og-image';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return new Response('Missing cardId', { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('vote_sessions')
      .select('id, query_text, is_consensus_reached, consensus_value, validator_responses, votes_yes, votes_no, not_voted')
      .eq('id', cardId)
      .single();

    if (error || !data) {
      return new Response('Card not found', { status: 404 });
    }

    const card: VoteResult = {
      id: data.id,
      queryText: data.query_text || 'Unknown Query',
      isConsensusReached: data.is_consensus_reached,
      consensusValue: data.consensus_value,
      validatorResponses: data.validator_responses || [],
      votingResult: {
        yes: data.votes_yes || 0,
        no: data.votes_no || 0,
        notVoted: data.not_voted || 0,
      },
    };

    const interFont = await fetch(
      'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2'
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(<OgImage card={card} />, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interFont,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Inter',
          data: interFont,
          style: 'normal',
          weight: 600,
        },
        {
          name: 'Inter',
          data: interFont,
          style: 'normal',
          weight: 700,
        },
      ],
    });
  } catch (error) {
    console.error('OG Image Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}