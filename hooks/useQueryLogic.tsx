"use client";

import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryStore } from "@/store/query-store";
import { useVoteStore } from "@/store/vote-store";
import { useBroadcastQuery } from "@/hooks/useBroadcastQuery";
import { Dispatch, SetStateAction } from "react";
import { getPlaceholderText } from "@/lib/query-utils";
import { toast } from "sonner";
import type { VoteResult } from "@/lib/types";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";
import { sanitizeQueryText } from "@/utils/security-utils";
import { supabase } from "@/lib/supabase-client";
import { useLLMStore } from "@/store/llm-store";
import { logger } from "@/lib/utils/client-logger";

interface UseQueryLogicProps {
  payWithWallet: boolean;
  setPayWithWallet: Dispatch<SetStateAction<boolean>>;
}

export default function useQueryLogic({
  payWithWallet,
  setPayWithWallet,
}: UseQueryLogicProps) {
  const [queryText, setQueryTextRaw] = useState<string>("");
  const setQueryText = useCallback((value: string | ((prev: string) => string)) => {
    setQueryTextRaw(value);
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);

  const { publicKey } = useWallet();
  const {
    queriesRequested,
    queryMode,
    viewMode,
    setQueriesRequested,
    resetAfterSubmission,
    selectedLLMIds,
  } = useQueryStore();
  const { voteHistory, lastVoteResult, setVoteHistory, setLastVoteResult } =
    useVoteStore();
  const { llms } = useLLMStore();

  const placeholderText = getPlaceholderText(queryMode);

  logger.debug("Initial queryMode:", queryMode, { context: "useQueryLogic" });

  const fetchCsrfToken = useCallback(async (): Promise<string> => {
    logger.debug("Starting CSRF token fetch", null, { context: "useQueryLogic" });
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const response = await fetch("/api/csrf-token", {
          method: "GET",
          credentials: "include",
        });
        logger.debug("CSRF fetch response:", {
          status: response.status,
          headers: Object.fromEntries(response.headers),
          timestamp: new Date().toISOString(),
        }, { context: "useQueryLogic" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error || `Failed to fetch CSRF token: ${response.status}`
          );
        }
        if (
          !data.csrfToken ||
          typeof data.csrfToken !== "string" ||
          data.csrfToken.length < 10
        ) {
          throw new Error("Invalid CSRF token format");
        }
        logger.debug(
          "CSRF token fetched successfully:",
          data.csrfToken,
          { context: "useQueryLogic" }
        );
        return data.csrfToken;
      } catch {
        attempts++;
        logger.error(
          `CSRF token fetch attempt ${attempts} failed`,
          { timestamp: new Date().toISOString() },
          { context: "useQueryLogic" }
        );
        if (attempts === maxAttempts) {
          throw new Error("Failed to fetch CSRF token after retries");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw new Error("Max CSRF token fetch attempts reached");
  }, []);

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session?.user?.email) {
          logger.warn(
            "No active session found during email fetch",
            null,
            { context: "useQueryLogic" }
          );
          return;
        }

        setEmail(session.user.email);
        // console.log("[useQueryLogic] Fetched email:", session.user.email, {
        //   timestamp: new Date().toISOString(),
        // });
      } catch {
        logger.error("Error fetching email", {
          timestamp: new Date().toISOString(),
        }, { context: "useQueryLogic" });
        toast.error("Failed to fetch user session. Please log in again.", {
          style: { background: "#dc2626", color: "#fee2e2" },
          duration: 5000,
        });
      }
    };
    fetchEmail();
  }, []);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q === "shop") {
        logger.debug(
          "URL param 'q' is 'shop', current queryMode:",
          queryMode,
          { context: "useQueryLogic" }
        );
      }
      logger.debug(
        `URL param 'q': ${q}, Current queryMode: ${queryMode}`,
        { timestamp: new Date().toISOString() },
        { context: "useQueryLogic" }
      );
    }
  }, [queryMode]);


  const handleSetVoteHistory: Dispatch<SetStateAction<VoteResult[]>> = (
    history
  ) => {
    setVoteHistory(history);
  };

  const handleSetLastVoteResult: Dispatch<SetStateAction<VoteResult | null>> = (
    result
  ) => {
    setLastVoteResult(result);
  };

  const { broadcastQuery } = useBroadcastQuery(
    handleSetVoteHistory,
    handleSetLastVoteResult,
    undefined,
    undefined
  );

  const handleQueryAmountChange = useCallback(
    (newAmount: number) => {
      const clampedAmount = Math.max(
        1,
        Math.min(ALLOWED_AMOUNT_QUERIES, newAmount)
      );
      logger.debug("Updating queriesRequested:", {
        clampedAmount,
        timestamp: new Date().toISOString(),
      }, { context: "useQueryLogic" });
      setQueriesRequested(clampedAmount, 100); // Default credit amount
    },
    [setQueriesRequested]
  );

  const handleSubmit = async () => {
    logger.debug("handleSubmit called", {
      queryText,
      queryMode,
      queriesRequested,
      selectedLLMIds,
      timestamp: new Date().toISOString(),
    }, { context: "useQueryLogic" });

    let actualSelectedIds: string[] | undefined;

    try {
      if (!queryText.trim()) {
        toast.error("Query cannot be empty", {
          style: { background: "#dc2626", color: "#fee2e2" },
          duration: 5000,
        });
        return null;
      }


      const enabledLLMs = llms.filter((llm) => llm.enabled);
      actualSelectedIds = enabledLLMs.map(llm => llm.id);
      
      if (enabledLLMs.length > 0 && queriesRequested > enabledLLMs.length) {
        logger.debug("Blocked: Queries requested exceeds selected LLMs", {
          queriesRequested,
          selectedLLMCount: enabledLLMs.length,
        }, { context: "useQueryLogic" });
        toast.error(`Cannot query ${queriesRequested} AIs when only ${enabledLLMs.length} are selected.`, {
          style: { background: "#dc2626", color: "#fee2e2" },
          duration: 5000,
        });
        return null;
      }
    } catch {
      const errorMessage = "Validation failed unexpectedly";
      setError(sanitizeQueryText(errorMessage));
      toast.error(errorMessage, {
        style: { background: "#dc2626", color: "#fee2e2" },
        duration: 5000,
      });
      setIsSubmitting(false);
      return null;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const csrfToken = await fetchCsrfToken();
      logger.debug("Processing query", {
        queriesRequested,
        publicKey: publicKey?.toBase58() || "none",
        email,
        csrfToken: csrfToken ? "[REDACTED]" : undefined,
        selectedLLMIds,
        timestamp: new Date().toISOString(),
      }, { context: "useQueryLogic" });
      await broadcastQuery({
        query: queryText,
        options: {
          csrfToken,
          queryMode,
          queriesRequested,
          isFreeQuery: true,
          selectedLLMIds: actualSelectedIds || selectedLLMIds,
        },
      });
      toast.success(
        `Query submitted successfully!`,
        {
          style: { background: "#22c55e", color: "#ffffff" },
          duration: 5000,
        }
      );
      resetAfterSubmission(100);
      setQueryText("");
      setPayWithWallet(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit query";
      setError(sanitizeQueryText(errorMessage));
      logger.error("Submission failed:", {
        errorMessage,
        queryText,
        queryMode,
        queriesRequested,
        selectedLLMIds,
        timestamp: new Date().toISOString(),
      }, { context: "useQueryLogic" });
      toast.error(errorMessage, {
        style: { background: "#dc2626", color: "#fee2e2" },
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    queriesRequested,
    queryText,
    setQueryText,
    isSubmitting,
    error,
    setError,
    placeholderText,
    availableQueries: 100,
    queryMode,
    viewMode,
    voteHistory,
    lastVoteResult,
    handleSubmit,
    handleQueryAmountChange,
  };
}