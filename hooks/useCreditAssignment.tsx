import { useCallback, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";

export const useCreditAssignment = () => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      console.log("Fetched CSRF token:", { csrfToken: data.csrfToken });
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      throw error;
    }
  }, []);

  const assignCredits = useCallback(
    async (
      signature: string,
      signedTx: Transaction,
      creditAmount: number,
      walletPublicKey: PublicKey,
    ) => {
      setIsAssigning(true);
      setError(null);
      try {
        // Fetch CSRF token if not cached
        const token = csrfToken || (await fetchCsrfToken());

        console.log("Sending request to /api/credits/assign with CSRF token:", { token });

        const response = await fetch("/api/credits/assign", {
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

        console.log("Credit assignment response:", {
          credits: data.credits,
          unpaidQueries: data.unpaidQueries,
        });

        setIsAssigning(false);
        return { credits: data.credits, unpaidQueries: data.unpaidQueries };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Credit assignment failed:", { error, message: errorMessage });
        setError(errorMessage);
        setIsAssigning(false);
        throw error;
      }
    },
    [csrfToken, fetchCsrfToken],
  );

  return { assignCredits, isAssigning, error };
};