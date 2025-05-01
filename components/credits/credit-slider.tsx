"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import CreditSliderUI from "./credit-slider-ui";
import { useSolanaTransaction } from "@/hooks/useSolanaTransaction";
import { useCreditAssignment } from "@/hooks/useCreditAssignment";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { VERAFY_WALLET, CREDIT_PRICE_SOL } from "@/lib/solana-constants";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";

export default function CreditSlider() {
  const [creditAmount, setCreditAmount] = useState(10);
  const { creditBalance, setCreditBalance } = useCreditBalance();
  const { publicKey, signTransaction, connected: isWalletConnected, disconnect } = useWallet();
  const {
    sendTransaction,
    isSending,
    error: txError,
  } = useSolanaTransaction(
    publicKey,
    signTransaction
      ? (tx: Transaction) => signTransaction(tx)
      : null
  );
  const {
    assignCredits,
    isAssigning,
    error: assignError,
  } = useCreditAssignment();
  const { setVisible } = useWalletModal();

  // Placeholder for solBalance (fetch actual balance if needed)
  const solBalance = 0; // TODO: Fetch balance using @solana/web3.js

  const requiredSol = creditAmount * CREDIT_PRICE_SOL;
  const hasEnoughSol = solBalance >= requiredSol;
  const isValid =
    creditAmount >= 1 && creditAmount <= 100 && Number.isInteger(creditAmount);

  const handlePayment = useCallback(async () => {
    if (!isWalletConnected) {
      setVisible(true);
      return;
    }
    if (!isValid) {
      toast.error("Credits must be a whole number between 1 and 100");
      return;
    }
    if (!hasEnoughSol) {
      toast.error(
        `Insufficient SOL: Need ${requiredSol.toFixed(3)}, have ${solBalance.toFixed(3)}`,
      );
      return;
    }
    if (!publicKey || !signTransaction) {
      toast.error("Wallet not fully connected. Please try again.");
      return;
    }

    const attemptTransaction = async (attempt: number): Promise<boolean> => {
      console.log(
        `Attempt ${attempt}: Initiating transaction for ${creditAmount} credits to ${VERAFY_WALLET}`,
      );
      try {
        const result = await sendTransaction(
          creditAmount,
          new PublicKey(VERAFY_WALLET),
        );
        console.log("Transaction data:", {
          signature: result.signature,
          signedTx: result.signedTx ? "Transaction" : "null",
          publicKey: publicKey?.toString(),
        });

        if (result.signature && result.signedTx && publicKey) {
          console.log(
            "Transaction sent, assigning credits with signature:",
            result.signature,
          );
          const newBalance = await assignCredits(
            result.signature,
            result.signedTx,
            creditAmount,
            publicKey,
          );
          setCreditBalance(newBalance);
          toast.success(`Successfully purchased ${creditAmount} credits!`);
          return true;
        } else {
          console.error("Missing transaction data:", {
            signature: result.signature ?? "undefined",
            signedTx: result.signedTx ? "Transaction" : "undefined",
            publicKey: publicKey?.toString() ?? "undefined",
          });
          return false;
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        return false;
      }
    };

    // First attempt
    let success = await attemptTransaction(1);
    if (!success) {
      // Retry once after a short delay
      console.log("Retrying transaction after 500ms delay...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      success = await attemptTransaction(2);
      if (!success) {
        toast.error("Transaction failed to complete. Please try again.");
      }
    }
  }, [
    isWalletConnected,
    isValid,
    hasEnoughSol,
    publicKey,
    signTransaction,
    creditAmount,
    solBalance,
    requiredSol,
    sendTransaction,
    assignCredits,
    setCreditBalance,
    setVisible,
  ]);

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