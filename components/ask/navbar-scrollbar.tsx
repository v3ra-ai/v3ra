"use client";

import { ViewMode } from "@/lib/types";
import { NavbarScrollbarUI } from "@/components/ask/navbar-scrollbar-ui";
import { useNavbarScrollbar } from "@/hooks/useNavbarScrollbar";

interface NavbarScrollbarProps {
  mounted: boolean;
  showSearch: boolean;
  viewMode: ViewMode;
}

export function NavbarScrollbar({ mounted, showSearch, viewMode }: NavbarScrollbarProps) {
  const {
    queryText,
    setQueryText,
    isSubmitting,
    payWithWallet,
    setPayWithWallet,
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