// Define pairing strategies
export const PAIRING_STRATEGIES = {
  SMART: 'SMART',
  UNDERDOG: 'UNDERDOG',
  TITANS: 'TITANS',
  OPEN_SOURCE: 'OPEN_SOURCE'
} as const;

export type PairingStrategy = keyof typeof PAIRING_STRATEGIES;