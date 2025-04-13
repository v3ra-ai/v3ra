// app/ask/page.tsx
"use client";

import AskForm from "./ask-form";
import { SolanaProvider } from "../../components/solana-provider";
import TopNav from "@/components/top-nav";

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