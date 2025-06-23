import { TruthArena } from "@/components/truth-arena/truth-arena";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Truth Arena - v3ra AI Consensus Network",
  description: "Refine truth consensus by choosing the best AI responses to real questions",
};

export default function TruthArenaPage() {
  return <TruthArena />;
}