"use client";

import { FC, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// WalletModalProvider requires its default styles
import { CURRENT_SOLANA_NETWORK_NAME, DEV_SOLANA_NETWORK_RPC, MAINNET_SOLANA_NETWORK_RPC } from "@/lib/constants";

// WalletModalProvider requires its default styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaProviderProps {
  children: React.ReactNode;
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  // Choose network via env or default to mainnet-beta
  const network: WalletAdapterNetwork =
    (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) ||
    (CURRENT_SOLANA_NETWORK_NAME === "Devnet"
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet);

  // RPC endpoint can be overridden via env; otherwise use clusterApiUrl
  const endpoint = useMemo<string>(() => {
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT)
      return process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT;
    if (network === WalletAdapterNetwork.Devnet && DEV_SOLANA_NETWORK_RPC)
      return DEV_SOLANA_NETWORK_RPC!;
    if (network === WalletAdapterNetwork.Mainnet && MAINNET_SOLANA_NETWORK_RPC)
      return MAINNET_SOLANA_NETWORK_RPC!;
    return clusterApiUrl(network);
  }, [network]);

  // Initialize supported wallets for production
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
