// components/credit-slider.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import CreditSliderUI from "./credit-slider-ui";
import { useSolanaWallet } from "../hooks/useSolanaWallet";
import { useSolanaTransaction } from "../hooks/useSolanaTransaction";
import { useCreditAssignment } from "../hooks/useCreditAssignment";
import { VERAFY_WALLET, CREDIT_PRICE_SOL } from "../lib/solana-constants";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export default function CreditSlider() {
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const { publicKey, signTransaction, solBalance, isWalletConnected } = useSolanaWallet();
  const { sendTransaction, isSending, error: txError, signature, signedTx } = useSolanaTransaction(
    publicKey,
    signTransaction,
  );
  const { assignCredits, isAssigning, error: assignError } = useCreditAssignment();
  const { setVisible } = useWalletModal();
  const { disconnect } = useWallet();

  const requiredSol = creditAmount * CREDIT_PRICE_SOL;
  const hasEnoughSol = solBalance >= requiredSol;
  const isValid = creditAmount >= 1 && creditAmount <= 100 && Number.isInteger(creditAmount);

  const fetchCreditBalance = async () => {
    if (!publicKey) return;
    try {
      const response = await fetch("/api/credits/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletPublicKey: publicKey.toBase58(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || response.statusText || "Unknown error";
        toast.error(`Failed to fetch credit balance: ${errorMsg}`);
        console.error("Failed to fetch credit balance:", errorMsg);
        setCreditBalance(0);
        return;
      }
      const data = await response.json();
      console.log("Fetched credit balance:", data.credits); // Debug log
      setCreditBalance(data.credits || 0);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error fetching credit balance: ${errorMsg}`);
      console.error("Error fetching credit balance:", error);
      setCreditBalance(0);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchCreditBalance();
    } else {
      setCreditBalance(null); // Reset balance when wallet is disconnected
    }
  }, [publicKey]);

  const handlePayment = async () => {
    if (!isWalletConnected) {
      setVisible(true);
      return;
    }
    if (!isValid) {
      toast.error("Credits must be a whole number between 1 and 100");
      return;
    }
    if (!hasEnoughSol) {
      toast.error(`Insufficient SOL: Need ${requiredSol.toFixed(3)}, have ${solBalance.toFixed(3)}`);
      return;
    }

    try {
      await sendTransaction(creditAmount, VERAFY_WALLET);
      if (signature && signedTx && publicKey) {
        await assignCredits(signature, signedTx, creditAmount, publicKey);
        await fetchCreditBalance(); // Refresh balance after purchase
      }
    } catch {
      // Errors are handled in hooks (via toast)
    }
  };

  const handleChangeWallet = async () => {
    await disconnect();
    setVisible(true);
  };

  useMemo(() => {
    if (txError) toast.error(txError);
    if (assignError) toast.error(assignError);
  }, [txError, assignError]);

  return (
    <CreditSliderUI
      creditAmount={creditAmount}
      setCreditAmount={setCreditAmount}
      requiredSol={requiredSol}
      creditBalance={creditBalance}
      isLoading={isSending || isAssigning}
      isValid={isValid}
      hasEnoughSol={hasEnoughSol}
      isWalletConnected={isWalletConnected}
      onPay={handlePayment}
      onChangeWallet={handleChangeWallet}
    />
  );
}