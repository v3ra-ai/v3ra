// components/CreditSlider.tsx
import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Slider } from "@radix-ui/react-slider";
import { toast } from "sonner";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection("https://api.testnet.solana.com", "confirmed");

export default function CreditSlider() {
  const { publicKey } = useWallet();
  const [creditAmount, setCreditAmount] = useState(1);
  const [creditBalance, setCreditBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [email, setEmail] = useState(""); // New state for email

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey).then((balance) => {
        setSolBalance(balance / LAMPORTS_PER_SOL);
      });
    }
  }, [publicKey]);

  const requiredSol = creditAmount * 0.001;
  const hasEnoughSol = solBalance >= requiredSol;
  const isValid = creditAmount >= 1 && creditAmount <= 100 && Number.isInteger(creditAmount);
  const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // Basic email validation

  const handlePayment = useCallback(async () => {
    if (!publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    if (!hasEnoughSol) {
      toast.error(`Insufficient SOL: Need ${requiredSol}, have ${solBalance}`);
      return;
    }
    if (email && !isEmailValid) {
      toast.error("Invalid email address");
      return;
    }

    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletPublicKey: publicKey.toBase58(),
          creditAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment failed");
      }

      const paymentData = await response.json();
      if (paymentData.success) {
        const assignResponse = await fetch("/api/credits/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletPublicKey: publicKey.toBase58(),
            creditAmount,
            email: email || undefined, // Include email if provided
          }),
        });

        if (!assignResponse.ok) throw new Error("Credit assignment failed");

        const assignData = await assignResponse.json();
        setCreditBalance(assignData.credits);
        toast.success(`${creditAmount} credits added! New balance: ${assignData.credits}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message.includes("retries") ? "Payment failed after retries" : "Error processing payment");
      console.error(error);
    }
  }, [publicKey, creditAmount, hasEnoughSol, email, isEmailValid]);

  return (
    <div className="p-4">
      <Slider
        value={[creditAmount]}
        onValueChange={(value) => setCreditAmount(Math.round(value[0]))}
        min={1}
        max={100}
        step={1}
        className="w-full"
      />
      <p className="mt-2 text-sm">
        Credits: {creditAmount} (Cost: {requiredSol} SOL)
      </p>
      {!isValid && (
        <p className="mt-2 text-sm text-red-500">
          Please select a whole number between 1 and 100 credits.
        </p>
      )}
      {!hasEnoughSol && (
        <p className="mt-2 text-sm text-red-500">
          Insufficient SOL: Need {requiredSol}, have {solBalance}.
        </p>
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
        className="mt-2 w-full p-2 border border-input rounded text-sm"
      />
      {!isEmailValid && email && (
        <p className="mt-2 text-sm text-red-500">
          Please enter a valid email or leave blank.
        </p>
      )}
      <p className="mt-2 text-sm">Current Balance: {creditBalance} credits</p>
      <button
        onClick={handlePayment}
        disabled={!publicKey || !isValid || !hasEnoughSol || !isEmailValid}
        className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
      >
        Pay
      </button>
    </div>
  );
}