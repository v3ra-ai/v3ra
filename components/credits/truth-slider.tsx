"use client";

import { useState, useMemo, useCallback, useEffect, Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import TruthSliderUI from "@/components/credits/truth-slider-ui";
import { useTruthTransaction } from "@/hooks/useTruthTransaction";
import { VERAFY_WALLET, connection, TRUTH_TOKEN_MINT, TRUTH_TOKEN_DECIMALS } from "@/lib/solana-constants";
import { TRUTH_QUERY_COST } from "@/lib/constants";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

interface TruthSliderProps {
  creditBalance: number | null;
  setCreditBalance: Dispatch<SetStateAction<number | null>>;
}

export default function TruthSlider({ creditBalance, setCreditBalance }: TruthSliderProps) {
  const [creditAmount, setCreditAmount] = useState(10);
  const { publicKey, signTransaction, connected: isWalletConnected, disconnect } = useWallet();
  const {
    sendTransaction,
    isSending,
    error: txError,
  } = useTruthTransaction(
    publicKey,
    signTransaction ? (tx: Transaction) => signTransaction(tx) : null
  );
  const { setVisible } = useWalletModal();
  const [truthBalance, setTruthBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Fetch CSRF token
  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await fetch("/api/csrf-token", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }
      const data = await response.json();
      console.log("[TruthSlider] Fetched CSRF token:", { csrfToken: data.csrfToken });
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    } catch (error) {
      console.error("[TruthSlider] Error fetching CSRF token:", error);
      throw error;
    }
  }, []);

  // Fetch $truth and SOL balance
  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      console.log("[TruthSlider] No publicKey, setting balances to null");
      setTruthBalance(null);
      setSolBalance(null);
      return;
    }

    console.log("[TruthSlider] Fetching balances for wallet:", {
      publicKey: publicKey.toBase58(),
      tokenMint: TRUTH_TOKEN_MINT.toBase58(),
      rpcEndpoint: connection.rpcEndpoint,
    });

    // Fetch $truth balance
    try {
      const tokenAccount = await getAssociatedTokenAddress(TRUTH_TOKEN_MINT, publicKey);
      console.log("[TruthSlider] Calculated $truth token account:", tokenAccount.toBase58());

      try {
        const accountInfo = await getAccount(connection, tokenAccount);
        console.log("[TruthSlider] Fetched $truth account info:", {
          amount: accountInfo.amount.toString(),
          decimals: TRUTH_TOKEN_DECIMALS,
        });

        const balance = Number(accountInfo.amount) / 10 ** TRUTH_TOKEN_DECIMALS;
        console.log("[TruthSlider] Calculated $truth balance:", balance);
        setTruthBalance(balance);
      } catch (error) {
        console.error("[TruthSlider] No $truth token account found:", error);
        toast.error("No $truth token account found for this wallet");
        setTruthBalance(0);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[TruthSlider] Error fetching $truth balance:", errorMessage);
      toast.error(`Failed to fetch $truth balance: ${errorMessage}`);
      setTruthBalance(0);
    }

    // Fetch SOL balance
    try {
      const balanceInLamports = await connection.getBalance(publicKey);
      const balanceInSol = balanceInLamports / 1_000_000_000; // Convert lamports to SOL
      console.log("[TruthSlider] Fetched SOL balance:", balanceInSol);
      setSolBalance(balanceInSol);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[TruthSlider] Error fetching SOL balance:", errorMessage);
      toast.error(`Failed to fetch SOL balance: ${errorMessage}`);
      setSolBalance(0);
    }
  }, [publicKey]);

  // Fetch balances when wallet connects
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances, publicKey]);

  const requiredTruth = creditAmount * TRUTH_QUERY_COST;
  const hasEnoughTruth = truthBalance !== null && truthBalance >= requiredTruth;
  const hasEnoughSol = solBalance !== null && solBalance >= 0.01; // Approx. fee for SPL transfer
  const isValid = creditAmount >= 1 && creditAmount <= 100 && Number.isInteger(creditAmount);

  // Assign credits for $truth
  const assignCredits = useCallback(
    async (
      signature: string,
      signedTx: Transaction,
      creditAmount: number,
      walletPublicKey: PublicKey,
    ) => {
      setIsAssigning(true);
      setAssignError(null);
      try {
        const token = csrfToken || (await fetchCsrfToken());

        console.log("[TruthSlider] Sending request to /api/credits-truth/assign with CSRF token:", { token });

        const response = await fetch("/api/credits-truth/assign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
          },
          credentials: "include",
          body: JSON.stringify({
            walletPublicKey: walletPublicKey.toBase58(),
            creditAmount,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to assign credits");
        }

        console.log("[TruthSlider] Credit assignment response:", {
          credits: data.credits,
          unpaidQueries: data.unpaidQueries,
        });

        setIsAssigning(false);
        return { credits: data.credits, unpaidQueries: data.unpaidQueries };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[TruthSlider] Credit assignment failed:", { error, message: errorMessage });
        setAssignError(errorMessage);
        setIsAssigning(false);
        throw error;
      }
    },
    [csrfToken, fetchCsrfToken],
  );

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
    if (!hasEnoughTruth) {
      toast.error(
        `Insufficient $truth: Need ${requiredTruth.toFixed(0)}, have ${truthBalance?.toFixed(0) ?? "0"}`
      );
      return;
    }
    if (!hasEnoughSol) {
      toast.error(
        `Insufficient SOL for transaction fees: Need at least 0.01 SOL, have ${solBalance?.toFixed(4) ?? "0"} SOL`
      );
      return;
    }
    if (!publicKey || !signTransaction) {
      setVisible(true);
      toast.error("Wallet not fully connected. Please reconnect and try again.");
      return;
    }

    const attemptTransaction = async (): Promise<boolean> => {
      console.log("[TruthSlider] Initiating $truth transaction for", {
        creditAmount,
        recipient: VERAFY_WALLET.toBase58(),
        requiredTruth,
        walletPublicKey: publicKey.toBase58(),
        truthBalance,
        solBalance,
        rpcEndpoint: connection.rpcEndpoint,
      });

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
          toast.success(`Successfully purchased ${creditAmount} credits with $truth!`);
          // Refresh balances after successful purchase
          await fetchBalances();
          // Notify other components of credit update
          window.dispatchEvent(new CustomEvent("credits-updated"));
          return true;
        }
        console.error("[TruthSlider] Transaction result invalid:", result);
        toast.error("Transaction failed: Invalid result");
        return false;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[TruthSlider] Transaction failed:", errorMessage);
        if (error instanceof WalletSignTransactionError) {
          toast.error("Transaction not approved. Please check your wallet and try again.");
        } else {
          toast.error(`Transaction failed: ${errorMessage}`);
        }
        return false;
      }
    };

    const success = await attemptTransaction();
    if (!success) {
      console.error("[TruthSlider] Transaction attempt failed");
      toast.error("Transaction failed. Please check your wallet, SOL balance, and network settings.");
    }
    return success;
  }, [
    isWalletConnected,
    isValid,
    hasEnoughTruth,
    hasEnoughSol,
    publicKey,
    signTransaction,
    creditAmount,
    truthBalance,
    solBalance,
    requiredTruth,
    sendTransaction,
    assignCredits,
    setCreditBalance,
    setVisible,
    fetchBalances,
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
    <TruthSliderUI
      creditAmount={creditAmount}
      setCreditAmount={setCreditAmount}
      requiredTruth={requiredTruth}
      creditBalance={creditBalance}
      truthBalance={truthBalance}
      isLoading={isSending || isAssigning}
      isValid={isValid}
      hasEnoughTruth={hasEnoughTruth}
      isWalletConnected={isWalletConnected}
      onPay={handlePayment}
      onChangeWallet={handleChangeWallet}
      decimalPlaces={0} // $truth uses whole numbers (1:1)
    />
  );
}