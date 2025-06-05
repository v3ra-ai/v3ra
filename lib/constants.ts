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

// Credits and Queries
// Constants for managing credits, query costs, and query limits in the application
export const QUERY_COST = 0.00001; // SOL per credit
export const TRUTH_TOKEN_MINT_ADDRESS = "2GmUPhpe93kcTJZrC7NJ2keeDZRT5dBveUgegb13pump";
export const TRUTH_TOKEN_DECIMALS = 6;
export const TRUTH_QUERY_COST = 1; // 1 $truth = 1 credit

// Calculate the number of decimal places in QUERY_COST for display
const getDecimalPlaces = (num: number): number => {
  if (!Number.isFinite(num)) return 0;
  const str = num.toFixed(20).replace(/\.?0+$/, "");
  const decimalIndex = str.indexOf(".");
  return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
};

export const QUERY_COST_FIXED_DECIMALS = getDecimalPlaces(QUERY_COST);
export const USER_FREE_CREDITS_DEFAULT = 0;
export const USER_PAID_CREDITS_DEFAULT = 0;
export const QUERIES_REQUESTED_DEFAULT = 4;
export const USER_CREDIT_CONVERSION_DEFAULT = 1;
export const QUERIES_COST_EACH_DEFAULT = 1;
export const ALLOWED_AMOUNT_QUERIES = 20;
export const INITIAL_AI_QUERY_AMOUNT_REQUESTED = QUERIES_REQUESTED_DEFAULT;
export const FREE_CREDITS_COOKIE_NAME = "verafy_free_credits";

// Voting Outcomes
// Constants for representing possible voting results
export const VOTE_YES = "YES";
export const VOTE_NO = "NO";
export const VOTE_ERROR = "ERROR";

export const MAX_VOTE_HISTORY_RESULTS = 300;
export const RECENT_HISTORY_RESULTS = 50;
export const RESULT_QUERIES_CARDS = 12;

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