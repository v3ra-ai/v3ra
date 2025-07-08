import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { rateLimitNormal } from "@/lib/middleware/rate-limit";

// TODO: This is a temporary implementation using in-memory storage
// In production, this should be stored in the database (User.customLLMSelection)
// For now, this will reset on server restart
const userPreferences = new Map<string, string[]>();

export const GET = rateLimitNormal(async () => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customLLMSelection = userPreferences.get(user.email!) || [];

    return NextResponse.json({ 
      customLLMSelection
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch custom LLM selection" },
      { status: 500 }
    );
  }
});

export const POST = rateLimitNormal(async (request: NextRequest) => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customLLMSelection } = await request.json();

    if (!Array.isArray(customLLMSelection)) {
      return NextResponse.json(
        { error: "Invalid custom LLM selection" },
        { status: 400 }
      );
    }

    // Limit to 5 selections
    const limitedSelection = customLLMSelection.slice(0, 5);
    
    // Store in memory for now
    userPreferences.set(user.email!, limitedSelection);

    return NextResponse.json({ 
      customLLMSelection: limitedSelection
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to save custom LLM selection" },
      { status: 500 }
    );
  }
});