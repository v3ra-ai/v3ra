"use client";

import { useCallback, useState, useEffect } from "react";
import { useQueryStore } from "@/store/query-store";
import { useVoteStore } from "@/store/vote-store";
import { useBlindTestQuery } from "@/hooks/useBlindTestQuery";
import { Dispatch, SetStateAction } from "react";
import { getPlaceholderText } from "@/lib/query-utils";
import { toast } from "sonner";
import type { VoteResult } from "@/lib/types";
import { sanitizeQueryText } from "@/utils/security-utils";
import { supabase } from "@/lib/supabase-client";
import { logger } from "@/lib/utils/client-logger";
import { csrfCache, sessionCache, requestDeduplicator } from "@/lib/utils/cache";

interface UseQueryLogicProps {
  payWithWallet: boolean;
  setPayWithWallet: Dispatch<SetStateAction<boolean>>;
  philosophyMode?: boolean;
}

export default function useQueryLogic({
  payWithWallet,
  setPayWithWallet,
  philosophyMode = false,
}: UseQueryLogicProps) {
  const [queryText, setQueryTextRaw] = useState<string>("");
  const setQueryText = useCallback((value: string | ((prev: string) => string)) => {
    setQueryTextRaw(value);
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);

  const {
    queryMode,
    resetAfterSubmission,
  } = useQueryStore();
  const { voteHistory, lastVoteResult, setVoteHistory, setLastVoteResult } =
    useVoteStore();

  const placeholderText = getPlaceholderText(queryMode);

  logger.debug("Initial queryMode:", queryMode, { context: "useQueryLogic" });

  const fetchCsrfToken = useCallback(async (): Promise<string> => {
    // Check cache first
    const cached = csrfCache.get('csrf-token');
    if (cached) {
      logger.debug("Using cached CSRF token", null, { context: "useQueryLogic" });
      return cached;
    }
    
    // Use request deduplication to prevent multiple simultaneous CSRF token fetches
    return requestDeduplicator.dedupe('csrf-token', async () => {
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
        
        // Cache the token for 30 minutes
        csrfCache.set('csrf-token', data.csrfToken);
        
        logger.debug(
          "CSRF token fetched and cached successfully:",
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
    });
  }, []);

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        // Check cache first
        const cachedSession = sessionCache.get('user-session');
        if (cachedSession?.user?.email) {
          setEmail(cachedSession.user.email);
          logger.debug("Using cached user session", null, { context: "useQueryLogic" });
          return;
        }
        
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

        // Cache the session
        sessionCache.set('user-session', session);
        setEmail(session.user.email);
        
        logger.debug("User session fetched and cached", {
          timestamp: new Date().toISOString(),
        }, { context: "useQueryLogic" });
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

  const { broadcastQuery } = useBlindTestQuery(
    handleSetVoteHistory,
    handleSetLastVoteResult
  );

  const handleQueryAmountChange = useCallback(
    (newAmount: number) => {
      // For blind testing, we always use 2 models
      logger.debug("Blind testing always uses 2 models", {
        timestamp: new Date().toISOString(),
      }, { context: "useQueryLogic" });
    },
    []
  );

  const handleSubmit = async () => {
    logger.debug("handleSubmit called for blind test", {
      queryText,
      timestamp: new Date().toISOString(),
    }, { context: "useQueryLogic" });

    try {
      if (!queryText.trim()) {
        toast.error("Query cannot be empty", {
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
      logger.debug("Processing blind test query", {
        email,
        csrfToken: csrfToken ? "[REDACTED]" : undefined,
        timestamp: new Date().toISOString(),
      }, { context: "useQueryLogic" });
      await broadcastQuery({
        query: queryText,
        options: {
          csrfToken,
          pairingStrategy: 'SMART', // Default to smart pairing for blind testing
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
    queriesRequested: 2, // Always 2 for blind testing
    queryText,
    setQueryText,
    isSubmitting,
    error,
    setError,
    placeholderText,
    availableQueries: 100,
    queryMode,
    voteHistory,
    lastVoteResult,
    handleSubmit,
    handleQueryAmountChange,
  };
}