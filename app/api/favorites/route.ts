import { NextRequest, NextResponse } from "next/server";
import { toggleFavorite, fetchUserFavorites } from "@/app/actions";
import { Favorite } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { voteSessionId } = await req.json();

    if (!voteSessionId) {
      return NextResponse.json(
        { error: "Missing voteSessionId" },
        { status: 400 }
      );
    }

    const result = await toggleFavorite(voteSessionId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const typedError = error as Error;
    console.error("[api/Favorite] Error toggling favorite:", typedError);
    return NextResponse.json({ error: typedError.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const favorites: Favorite[] | { error: string } =
      await fetchUserFavorites();

    if ("error" in favorites) {
      return NextResponse.json({ error: favorites.error }, { status: 500 });
    }

    return NextResponse.json(favorites);
  } catch (error) {
    const typedError = error as Error;
    console.error("[api/Favorite] Error fetching favorites:", typedError);
    return NextResponse.json({ error: typedError.message }, { status: 500 });
  }
}
