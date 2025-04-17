// hooks/useSolanaWallet.ts
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { connection } from "@/lib/solana-constants";

interface SolanaWallet {
  publicKey: PublicKey | null;
  signTransaction:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T,
      ) => Promise<T>)
    | null;
  solBalance: number;
  isWalletConnected: boolean;
}

export const useSolanaWallet = (): SolanaWallet => {
  const { publicKey, signTransaction } = useWallet();
  const [solBalance, setSolBalance] = useState(0);

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey).then((balance) => {
        setSolBalance(balance / 1_000_000_000);
      });
    }
  }, [publicKey]);

  return {
    publicKey,
    signTransaction: signTransaction ?? null,
    solBalance,
    isWalletConnected: !!publicKey,
  };
};
