"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function MobileWalletButton() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    if (publicKey) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      disabled={connecting}
      className="font-medium"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {connecting ? (
        "Connecting..."
      ) : publicKey ? (
        `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
      ) : (
        "Connect"
      )}
    </Button>
  );
}