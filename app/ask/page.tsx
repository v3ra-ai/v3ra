// app/ask/page.tsx
"use client";

import { TopNav } from "./top-nav";
import AskForm from "./ask-form";
import { SolanaProvider } from "../../components/solana-provider";

export default function Ask() {
  return (
    <SolanaProvider>
      <div className="min-h-screen bg-black text-white">
        <TopNav />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <AskForm />
        </div>
      </div>
    </SolanaProvider>
  );
}