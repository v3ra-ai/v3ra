"use client";

import { useState, useMemo, useCallback, useEffect, Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import CreditSliderUI from "./credit-slider-ui";
import { useSolanaTransaction } from "@/hooks/useSolanaTransaction";
import { useCreditAssignment } from "@/hooks/useCreditAssignment";
import { VERAFY_WALLET, connection } from "@/lib/solana-constants";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SendTransactionError } from "@solana/web3.js";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";

interface CreditSliderProps {
  creditBalance: number | null;
  setCreditBalance: Dispatch<SetStateAction<number | null>>;
}

export default function CreditSlider({ creditBalance, setCreditBalance }: CreditSliderProps) {
  const [creditAmount, setCreditAmount] = useState(10);
  const { publicKey, signTransaction, connected: isWalletConnected, disconnect } = useWallet();
  const {
    sendTransaction,
    isSending,
    error: txError,
  } = useSolanaTransaction(
    publicKey,
    signTransaction ? (tx: Transaction) => signTransaction(tx) : null
  );
  const {
    assignCredits,
    isAssigning,
    error: assignError,
  } = useCreditAssignment();
  const { setVisible } = useWalletModal();
  const [solBalance, setSolBalance] = useState<number | null>(null);

  // Fetch SOL balance when wallet is connected
  useEffect(() => {
    const fetchSolBalance = async () => {
      if (!publicKey) {
        setSolBalance(null);
        return;
      }
      try {
        const balanceInLamports = await connection.getBalance(publicKey);
        const balanceInSol = balanceInLamports / 1_000_000_000; // Convert lamports to SOL
        setSolBalance(balanceInSol);
        if (process.env.NODE_ENV === "development") {
          console.log("Fetched solBalance:", balanceInSol);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching SOL balance:", errorMessage);
        setSolBalance(0);
        toast.error(`Failed to fetch SOL balance: ${errorMessage}`);
      }
    };

    fetchSolBalance();
  }, [publicKey]);

  const requiredSol = creditAmount * QUERY_COST;
  const hasEnoughSol = solBalance !== null && solBalance >= requiredSol;
  const isValid = creditAmount >= 1 && creditAmount <= 100 && Number.isInteger(creditAmount);

  const handlePayment = useCallback(async () => {
    if (!isWalletConnected) {
      setVisible(true);
      toast.error("Please connect your wallet to proceed.");
      return;
    }
    if (!isValid) {
      toast.error("Credits must be a whole number between 1 and 100");
      return;
    }
    if (!hasEnoughSol) {
      toast.error(
        `Insufficient SOL: Need ${requiredSol.toFixed(QUERY_COST_FIXED_DECIMALS)}, have ${solBalance?.toFixed(QUERY_COST_FIXED_DECIMALS) ?? "0"}`
      );
      return;
    }
    if (!publicKey || !signTransaction) {
      setVisible(true);
      toast.error("Wallet not fully connected. Please reconnect and try again.");
      return;
    }

    const attemptTransaction = async (): Promise<boolean> => {
      console.log(`Initiating transaction for ${creditAmount} credits to ${VERAFY_WALLET}`, {
        creditAmount,
        recipient: VERAFY_WALLET,
        requiredSol,
        walletPublicKey: publicKey.toBase58(),
      });

      try {
        const verafyBalance = await connection.getBalance(new PublicKey(VERAFY_WALLET));
        if (verafyBalance === 0) {
          toast.error("Recipient wallet is not initialized. Contact support.");
          return false;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error checking VERAFY_WALLET:", errorMessage);
        toast.error("Failed to verify recipient wallet. Please try again.");
        return false;
      }

      try {
        const result = await sendTransaction(creditAmount, new PublicKey(VERAFY_WALLET));
        if (result.signature && result.signedTx && publicKey) {
          const newBalance = await assignCredits(
            result.signature,
            result.signedTx,
            creditAmount,
            publicKey
          );
          setCreditBalance(newBalance.credits ?? 0);
          toast.success(`Successfully purchased ${creditAmount} credits!`);
          return true;
        }
        return false;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Transaction failed:", errorMessage);
        if (error instanceof WalletSignTransactionError) {
          toast.error("Transaction not approved. Please check your wallet and try again.");
        } else if (error instanceof SendTransactionError) {
          toast.error(`Transaction failed: ${errorMessage}. Check console for details.`);
        } else {
          toast.error(`Transaction failed: ${errorMessage}. Please try again.`);
        }
        return false;
      }
    };

    const success = await attemptTransaction();
    if (!success) {
      toast.error("Transaction failed. Please ensure your wallet is set to the correct network.");
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
      solBalance={solBalance}
      isLoading={isSending || isAssigning}
      isValid={isValid}
      hasEnoughSol={hasEnoughSol}
      isWalletConnected={isWalletConnected}
      onPay={handlePayment}
      onChangeWallet={handleChangeWallet}
      decimalPlaces={QUERY_COST_FIXED_DECIMALS}
    />
  );
}