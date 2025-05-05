"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import CreditSliderUI from "./credit-slider-ui";
import { useSolanaTransaction } from "@/hooks/useSolanaTransaction";
import { useCreditAssignment } from "@/hooks/useCreditAssignment";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { VERAFY_WALLET } from "@/lib/solana-constants";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, Connection, SendTransactionError } from "@solana/web3.js";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";

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

  // State for solBalance
  const [solBalance, setSolBalance] = useState<number | null>(null);

  console.log(`NEXT_PUBLIC_CURRENT_SOLANA_NETWORK_NAME ${process.env.NEXT_PUBLIC_CURRENT_SOLANA_NETWORK_NAME}`);
  console.log(`NEXT_PUBLIC_DEVNET_SOLANA_NETWORK_RPC ${process.env.NEXT_PUBLIC_DEVNET_SOLANA_NETWORK_RPC}`);

  // Fetch SOL balance when wallet is connected
  useEffect(() => {
    const fetchSolBalance = async () => {
      if (!publicKey) {
        setSolBalance(null);
        return;
      }
      try {
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const balanceInLamports = await connection.getBalance(publicKey);
        const balanceInSol = balanceInLamports / 1_000_000_000; // Convert lamports to SOL
        setSolBalance(balanceInSol);
        if (process.env.NODE_ENV === "development") {
          console.log("Fetched solBalance:", balanceInSol);
        }
      } catch (error) {
        console.error("Error fetching SOL balance:", error);
        setSolBalance(0);
      }
    };

    fetchSolBalance();
  }, [publicKey]);

  const requiredSol = creditAmount * QUERY_COST;
  const hasEnoughSol = solBalance !== null && solBalance >= requiredSol;
  const isValid =
    creditAmount >= 1 && creditAmount <= 100 && Number.isInteger(creditAmount);

  // Debug log to confirm QUERY_COST_FIXED_DECIMALS and button state
  if (process.env.NODE_ENV === "development") {
    console.log({
      QUERY_COST,
      QUERY_COST_FIXED_DECIMALS,
      creditAmount,
      requiredSol,
      solBalance,
      hasEnoughSol,
      isValid,
      isLoading: isSending || isAssigning,
      isWalletConnected,
    });
  }

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
        `Insufficient SOL: Need ${requiredSol.toFixed(QUERY_COST_FIXED_DECIMALS)}, have ${solBalance?.toFixed(QUERY_COST_FIXED_DECIMALS) ?? "0"}`,
      );
      return;
    }
    if (!publicKey || !signTransaction) {
      setVisible(true);
      toast.error("Wallet not fully connected. Please reconnect and try again.");
      return;
    }

    const attemptTransaction = async (): Promise<boolean> => {
      console.log(
        `Initiating transaction for ${creditAmount} credits to ${VERAFY_WALLET}`,
        { creditAmount, recipient: VERAFY_WALLET, requiredSol, walletPublicKey: publicKey.toBase58() }
      );

      // Debug wallet state before transaction
      if (process.env.NODE_ENV === "development") {
        console.log("Wallet state before transaction:", {
          publicKey: publicKey.toBase58(),
          signTransactionAvailable: !!signTransaction,
          isWalletConnected,
        });
      }

      // Check VERAFY_WALLET initialization
      try {
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const verafyBalance = await connection.getBalance(new PublicKey(VERAFY_WALLET));
        console.log("VERAFY_WALLET initialization:", {
          address: VERAFY_WALLET,
          balanceInSol: verafyBalance / 1_000_000_000,
        });
        if (verafyBalance === 0) {
          toast.error("Recipient wallet (VERAFY_WALLET) is not initialized. Contact support.");
          return false;
        }
      } catch (error) {
        console.error("Error checking VERAFY_WALLET initialization:", error);
        toast.error("Failed to verify recipient wallet. Please try again.");
        return false;
      }

      try {
        const result = await sendTransaction(
          creditAmount,
          new PublicKey(VERAFY_WALLET),
        );
        console.log("Transaction result:", {
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
          setCreditBalance(newBalance.credits ?? 0); // Extract credits
          toast.success(`Successfully purchased ${creditAmount} credits!`);
          return true;
        } else {
          console.error("Missing transaction data:", {
            signature: result.signature ?? "undefined",
            signedTx: result.signedTx ? "Transaction" : "null",
            publicKey: publicKey?.toString() ?? "undefined",
          });
          return false;
        }
      } catch (error: unknown) {
        console.error("Transaction failed:", error);
        if (error instanceof Error) {
          if (error instanceof WalletSignTransactionError) {
            console.error("WalletSignTransactionError details:", {
              message: error.message,
              name: error.name,
            });
            toast.error(
              "Wallet signing failed: Ensure your wallet (e.g., Phantom) is open, unlocked, set to Devnet, and approve the transaction.",
            );
          } else if (error instanceof SendTransactionError) {
            console.error("SendTransactionError details:", {
              message: error.message,
              logs: error.logs,
            });
            toast.error(`Transaction failed: ${error.message}. Check console for logs.`);
          } else {
            console.error("Generic error details:", {
              message: error.message,
              name: error.name,
            });
            toast.error(`Transaction failed: ${error.message}. Please try again.`);
          }
        } else {
          toast.error("Transaction failed: Unknown error. Please try again.");
        }
        return false;
      }
    };

    // Execute transaction
    const success = await attemptTransaction();
    if (!success) {
      toast.error("Transaction failed. Please ensure your wallet is set to Devnet and try again.");
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