"use client";

import { useBackgroundImage } from "@/hooks/useBackgroundImage";
import Navbar from "@/components/ask/navbar/navbar";
import AskFooter from "@/components/ask/ask-footer";
import CardViewer from "@/components/ask/card-client-wrapper";
import { VoteResult } from "@/lib/types";

interface CardPageClientProps {
  cardId: string;
  result: VoteResult | { error: string };
}

export default function CardPageClient({ result }: CardPageClientProps) {
  const backgroundImage = useBackgroundImage();

  if ("error" in result) {
    return (
      <main
        className="min-h-screen bg-background flex flex-col"
        style={{
          backgroundImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          width: "100vw",
          height: "100vh",
        }}
      >
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <p className="text-red-500">{result.error}</p>
        </div>
        <AskFooter />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-background flex flex-col"
      style={{
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        width: "100vw",
        height: "100vh",
      }}
    >
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4">
        <CardViewer query={result} layoutMode="row" />
      </div>
      <AskFooter />
    </main>
  );
}