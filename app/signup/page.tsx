import { Suspense } from "react";
import SignupClient from "./signup-client";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
      <SignupClient />
    </Suspense>
  );
}