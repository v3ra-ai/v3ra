import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createSupabaseServerClient } from "@/lib/supabase-client";

export async function POST(request: Request) {
  try {
    const { userId, component, action } = await request.json();
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedback = await prisma.feedback.findFirst({
      where: { userId, component, action },
      select: { rating: true },
    });

    return NextResponse.json({ rating: feedback?.rating || null });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[FeedbackCheck] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
