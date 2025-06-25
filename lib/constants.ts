// lib/constants.ts

// Solana Network Configuration
// Constants for configuring the Solana network (Devnet or Mainnet) based on environment variables
export const CURRENT_SOLANA_NETWORK_NAME = process.env.NEXT_PUBLIC_CURRENT_SOLANA_NETWORK_NAME || "Mainnet";
export const DEV_SOLANA_NETWORK_RPC =
  process.env.NEXT_PUBLIC_DEVNET_SOLANA_NETWORK_RPC;
export const MAINNET_SOLANA_NETWORK_RPC =
  process.env.NEXT_PUBLIC_MAINNET_SOLANA_NETWORK_RPC;
export const CURRENT_SOLANA_NETWORK_RPC =
  CURRENT_SOLANA_NETWORK_NAME === "Devnet"
    ? DEV_SOLANA_NETWORK_RPC
    : MAINNET_SOLANA_NETWORK_RPC;

// Queries
// Constants for managing queries in the application
export const QUERIES_REQUESTED_DEFAULT = 4;
export const ALLOWED_AMOUNT_QUERIES = 20;
export const QUERIES_COST_EACH_DEFAULT = 1;

// Voting Outcomes
// Constants for representing possible voting results
export const VOTE_YES = "YES";
export const VOTE_NO = "NO";
export const VOTE_ERROR = "ERROR";

export const MAX_VOTE_HISTORY_RESULTS = 300;
export const RECENT_HISTORY_RESULTS = 50;
export const RESULT_QUERIES_CARDS = 12;

// Pagination constants for infinite scroll
export const INITIAL_LOAD_COUNT = 12; // Initial load same as current
export const LOAD_MORE_COUNT = 12; // Load 12 more each time
export const SCROLL_THRESHOLD = 0.8; // Load more when 80% scrolled
export const PRELOAD_THRESHOLD = 200; // Preload when within 200px of bottom

export const EXPORT_MAX_VALIDATORS = 20;

// Authentication
// Constants for managing user authentication and authorization
export const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((email) => email.trim())
  : [];

function getCurrentDomain(): string | null {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname === 'localhost') {
      return 'localhost:3000';
    }
    return window.location.hostname;
  }
  return null;
}

export function getCurrentDomainSafe(): string {
  const domain = getCurrentDomain();
  if (domain === null) {
    return 'localhost:3000';
  }
  return domain;
}

export function getBaseUrl(): string {
  const domain = getCurrentDomainSafe();
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${domain}`;
}

export const CURRENT_DOMAIN: string = typeof window !== 'undefined' ? getCurrentDomainSafe() : 'localhost:3000';