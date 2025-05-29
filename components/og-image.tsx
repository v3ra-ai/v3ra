import { CURRENT_DOMAIN } from '@/lib/constants';
import { VoteResult } from '@/lib/types';
import Image from 'next/image';

export function OgImage({ card }: { card: VoteResult }) {
  const consensusText = card.isConsensusReached
    ? card.consensusValue
      ? 'True'
      : 'False'
    : 'No Consensus';
  const voteCount = card.validatorResponses.length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#f4f4f5',
        fontFamily: '"Inter"',
        padding: '40px',
      }}
    >
      <h1 style={{ fontSize: '36px', fontWeight: 700, textAlign: 'center', maxWidth: '1000px' }}>
        {card.queryText}
      </h1>
      <p style={{ fontSize: '30px', fontWeight: 600, color: '#2563eb' }}>{consensusText}</p>
      <p style={{ fontSize: '18px', color: '#71717a' }}>
        Validated by {voteCount} AI validator{voteCount !== 1 ? 's' : ''}
      </p>
      <div style={{ position: 'absolute', bottom: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative', width: '100px', height: '40px' }}>
          <Image
            src={`https://${CURRENT_DOMAIN}/verafy_logo_black.svg`}
            alt="Verafy Logo"
            fill
            style={{ objectFit: 'contain' }}
            sizes="100px"
            priority={false}
          />
        </div>
        <p style={{ fontSize: '14px', color: '#71717a' }}>Powered by Verafy</p>
      </div>
    </div>
  );
}