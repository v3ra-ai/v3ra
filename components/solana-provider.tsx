"use client";

import { FC } from "react";

interface SolanaProviderProps {
  children: React.ReactNode;
}

// Temporary pass-through component - Solana wallet functionality removed
export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  return <>{children}</>;
};
