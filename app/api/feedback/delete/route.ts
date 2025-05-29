import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createSupabaseServerClient } from "@/lib/supabase-client";

export async function POST(request: Request) {
  try {
    const { component, action } = await request.json();
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.feedback.deleteMany({
      where: { userId: user.id, component, action },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[FeedbackDelete] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
