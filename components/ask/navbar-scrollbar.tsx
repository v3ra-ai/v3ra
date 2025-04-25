"use client";

import { ViewMode } from "@/store/query-store";
import { NavbarScrollbarUI } from "@/components/ask/navbar-scrollbar-ui";
import { useNavbarScrollbar } from "@/hooks/useNavbarScrollbar";

interface NavbarScrollbarProps {
  mounted: boolean;
  showSearch: boolean;
  viewMode: ViewMode;
}

/**
 * Container for the scroll-based search bar that appears when scrolling past 50px.
 * Manages state and logic via useNavbarScrollbar and renders UI via NavbarScrollbarUI.
 * Users submit queries by pressing Enter.
 */
export function NavbarScrollbar({ mounted, showSearch, viewMode }: NavbarScrollbarProps) {
  const {
    queryText,
    setQueryText,
    isSubmitting,
    payWithWallet,
    setPayWithWallet,
    hasPaid,
    setHasPaid,
    hasAttemptedSubmit,
    queriesRequested,
    userCreditsTotal,
    userFreeCredits,
    userPaidCredits,
    queriesUnpaid,
    queriesCostTotal,
    queryMode,
    updateQueryAmountRequested,
    handleKeyDown,
  } = useNavbarScrollbar();

  if (!mounted || !showSearch) return null;

  return (
    <NavbarScrollbarUI
      queryText={queryText}
      setQueryText={setQueryText}
      isSubmitting={isSubmitting}
      payWithWallet={payWithWallet}
      setPayWithWallet={setPayWithWallet}
      hasPaid={hasPaid}
      setHasPaid={setHasPaid}
      hasAttemptedSubmit={hasAttemptedSubmit}
      queriesRequested={queriesRequested}
      userCreditsTotal={userCreditsTotal}
      userFreeCredits={userFreeCredits}
      userPaidCredits={userPaidCredits}
      queriesUnpaid={queriesUnpaid}
      queriesCostTotal={queriesCostTotal}
      queryMode={queryMode}
      viewMode={viewMode}
      updateQueryAmountRequested={updateQueryAmountRequested}
      handleKeyDown={handleKeyDown}
    />
  );
}