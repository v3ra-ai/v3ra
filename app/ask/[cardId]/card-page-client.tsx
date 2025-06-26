"use client";

import Navbar from "@/components/ask/navbar/navbar";
import AskFooter from "@/components/ask/ask-footer";
import CardViewer from "@/components/ask/card-client-wrapper";
import { VoteResult } from "@/lib/types";

interface CardPageClientProps {
  cardId: string;
  result: VoteResult | { error: string };
}

export default function CardPageClient({ result }: CardPageClientProps) {

  if ("error" in result) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <p className="text-red-500">{result.error}</p>
        </div>
        {/* <FeedbackWidget
          component="AskCardPage"
          action="view"
          className="fixed bottom-5 right-4"
        />
        <FeedbackModal /> */}
        <AskFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4">
        <CardViewer query={result} layoutMode="row" />
      </div>
      <AskFooter />
    </main>
  );
}
