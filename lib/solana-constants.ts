import { Connection, PublicKey } from "@solana/web3.js";
import { CURRENT_SOLANA_NETWORK_NAME, DEV_SOLANA_NETWORK_RPC, MAINNET_SOLANA_NETWORK_RPC, QUERY_COST } from "./constants";

// $truth token constants
export const TRUTH_TOKEN_MINT = new PublicKey("2GmUPhpe93kcTJZrC7NJ2keeDZRT5dBveUgegb13pump");
export const TRUTH_TOKEN_DECIMALS = 6;

// Default to Mainnet RPC if environment variable is undefined
const DEFAULT_MAINNET_RPC = "https://api.mainnet-beta.solana.com";
const DEFAULT_DEVNET_RPC = "https://api.devnet.solana.com";

export const connection = new Connection(
  CURRENT_SOLANA_NETWORK_NAME === "Devnet"
    ? DEV_SOLANA_NETWORK_RPC || DEFAULT_DEVNET_RPC
    : MAINNET_SOLANA_NETWORK_RPC || DEFAULT_MAINNET_RPC,
  "confirmed",
);

export const CREDIT_PRICE_SOL = QUERY_COST;

const VERAFY_WALLET_PUBLIC_KEY = process.env.NEXT_PUBLIC_VERAFY_WALLET_PUBLIC_KEY;
let VERAFY_WALLET: PublicKey;

try {
  if (!VERAFY_WALLET_PUBLIC_KEY) {
    throw new Error("NEXT_PUBLIC_VERAFY_WALLET_PUBLIC_KEY is not defined");
  }
  VERAFY_WALLET = new PublicKey(VERAFY_WALLET_PUBLIC_KEY);
} catch (error) {
  console.error("Invalid NEXT_PUBLIC_VERAFY_WALLET_PUBLIC_KEY:", error);
  throw error;
}

export { VERAFY_WALLET };