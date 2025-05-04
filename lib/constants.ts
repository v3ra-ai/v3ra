// Solana Network Configuration
// Constants for configuring the Solana network (Devnet or Mainnet) based on environment variables
export const CURRENT_SOLANA_NETWORK_NAME =
  process.env.NEXT_PUBLIC_CURRENT_SOLANA_NETWORK_NAME;
export const DEV_SOLANA_NETWORK_RPC = process.env.NEXT_PUBLIC_DEVNET_SOLANA_NETWORK_RPC;
export const MAINNET_SOLANA_NETWORK_RPC =
  process.env.NEXT_PUBLIC_MAINNET_SOLANA_NETWORK_RPC;
export const CURRENT_SOLANA_NETWORK_RPC =
  CURRENT_SOLANA_NETWORK_NAME === "Devnet"
    ? DEV_SOLANA_NETWORK_RPC
    : MAINNET_SOLANA_NETWORK_RPC;

// Credits and Queries
// Constants for managing credits, query costs, and query limits in the application
export const QUERY_COST = 0.00001; // SOL per credit

// Calculate the number of decimal places in QUERY_COST for display
const getDecimalPlaces = (num: number): number => {
  if (!Number.isFinite(num)) return 0;
  const str = num.toFixed(20).replace(/\.?0+$/, ""); // Handle scientific notation and trailing zeros
  const decimalIndex = str.indexOf(".");
  return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
};

export const QUERY_COST_FIXED_DECIMALS = getDecimalPlaces(QUERY_COST); // Derived from QUERY_COST
export const USER_FREE_CREDITS_DEFAULT = 10;
export const USER_PAID_CREDITS_DEFAULT = 0;
export const QUERIES_REQUESTED_DEFAULT = 4;
export const USER_CREDIT_CONVERSION_DEFAULT = 1;
export const QUERIES_COST_EACH_DEFAULT = 1;
export const ALLOWED_AMOUNT_QUERIES = 20;
export const INITIAL_AVAILABLE_QUERIES = USER_FREE_CREDITS_DEFAULT; // Initial queries available, matches USER_FREE_CREDITS_DEFAULT
export const INITIAL_AI_QUERY_AMOUNT_REQUESTED = QUERIES_REQUESTED_DEFAULT; // Default AI query amount, matches QUERIES_REQUESTED_DEFAULT

// Voting Outcomes
// Constants for representing possible voting results
export const VOTE_YES = "YES";
export const VOTE_NO = "NO";
export const VOTE_ERROR = "ERROR";

export const MAX_VOTE_HISTORY_RESULTS = 300;
export const RECENT_HISTORY_RESULTS = 50;