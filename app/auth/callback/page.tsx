"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { prisma } from "@/lib/db/client";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner-new";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const user = data.session?.user;
        if (!user) throw new Error("No user found in session");

        let dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              id: user.id,
              email: user.email || "",
              name: user.user_metadata?.username || user.email?.split("@")[0] || "User",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }

        router.push("/profile");
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Auth callback error:", error.message);
        router.push("/signup?error=Authentication failed");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <LoadingSpinner type="beat" message="Processing authentication..." />
    </div>
  );
}