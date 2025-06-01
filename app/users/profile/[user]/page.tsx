import { createSupabaseServerClient } from "@/lib/supabase-client";
import { createOrGetUser } from "@/lib/server-actions";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import FavoritesTable from "@/components/profile/favorites-table";
import FeedbackTable from "@/components/profile/feedback-table";
import { Favorite, Feedback } from "@/lib/types";
import { User } from "lucide-react";

export default async function UserProfilePage({ params }: { params: Promise<{ user: string }> }) {
  // Get Supabase session server-side
  const supabase = await createSupabaseServerClient();

  // Debug server-side cookies with details
  const cookieStore = await cookies();
  const serverCookies = cookieStore.getAll().map(({ name, value }) => ({ name, value }));
  console.log("Server-side cookies in profile:", serverCookies);

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log("Profile session:", { sessionData, sessionError });

  if (sessionError || !sessionData.session) {
    console.log("No session found. Expected cookies:", [
      'sb-access-token',
      'sb-refresh-token',
      'sb-quuuhdbozcmhkwzhamuh-auth-token',
    ]);
    redirect("/login?error=Please log in to view your profile");
  }

  const user = sessionData.session.user;
  const resolvedParams = await params;
  if (user.id !== resolvedParams.user) {
    redirect("/login?error=Unauthorized access to this profile");
  }

  // Fetch user data using Server Action
  const result = await createOrGetUser(user.id, user.email || "", user.user_metadata?.username);
  console.log("Profile user result:", result);

  if (!result.success || !result.user) {
    redirect(`/login?error=${encodeURIComponent(result.error || "Failed to load profile")}`);
  }

  const dbUser = result.user;

  // Fetch favorites
  let favorites: Array<Favorite & { queryText?: string }> = [];
  try {
    const { data, error } = await supabase
      .from('Favorite')
      .select('id, user_id, vote_session_id, created_at')
      .eq('user_id', user.id)
      .limit(20);

    if (error) {
      console.error("Error fetching favorites:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        table: 'Favorite',
        userId: user.id,
      });
      throw error;
    }

    favorites = (data || []).map(f => ({ ...f, queryText: f.vote_session_id }));
    console.log("Fetched favorites:", favorites);
  } catch (error) {
    console.error("Favorites query failed:", error);
    favorites = [];
  }

  // Fetch feedback
  let feedback: Feedback[] = [];
  try {
    const { data, error } = await supabase
      .from('Feedback')
      .select('id, userId, rating, username, email, url, component, action, explanation, options, createdAt')
      .eq('userId', user.id)
      .limit(20);

    if (error) {
      console.error("Error fetching feedback:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        table: 'Feedback',
        userId: user.id,
      });
      throw error;
    }

    console.log("Feedback query result:", {
      rowCount: data?.length || 0,
      rawData: data,
      createdAtSamples: data?.map(item => item.createdAt).slice(0, 5),
      feedbackData: data?.map(item => ({
        id: item.id,
        action: item.action,
        url: item.url,
        explanation: item.explanation,
        options: item.options,
        component: item.component,
        username: item.username,
        rating: item.rating,
      })),
    });
    feedback = data || [];
  } catch (error) {
    console.error("Feedback query failed:", error);
    feedback = [];
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="p-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
        <div className="flex items-center justify-center mb-8">
          <User className="w-8 h-8 mr-2 text-zinc-800 dark:text-zinc-200" />
          <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-200">
            {dbUser.name ? `${dbUser.name}'s Profile` : 'Your Profile'}
          </h1>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">Email</p>
            <p className="text-zinc-800 dark:text-zinc-200">{dbUser.email}</p>
          </div>
          <div>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">Username</p>
            <p className="text-zinc-800 dark:text-zinc-200">{dbUser.name}</p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Button
            asChild
            className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 cursor-pointer"
          >
            {/* <Link href={`/users/settings/${user.id}`}>
              Edit Profile
            </Link> */}
          </Button>
        </div>
      </div>
      <FavoritesTable favorites={favorites} />
      <FeedbackTable feedback={feedback} />
    </div>
  );
}