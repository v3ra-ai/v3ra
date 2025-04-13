// lib/solana-constants.ts
import { Connection, PublicKey } from "@solana/web3.js";

export const connection = new Connection("https://api.devnet.solana.com", "confirmed");
export const CREDIT_PRICE_SOL = 0.001;

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