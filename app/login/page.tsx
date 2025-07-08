import { Suspense } from "react";
import { Navbar } from "@/components/shared/navbar";
import LoginClient from "./login-client";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <LoginClient />
      </Suspense>
    </div>
  );
}