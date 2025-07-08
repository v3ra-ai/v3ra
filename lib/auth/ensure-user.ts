import { prisma } from "@/lib/db/client";
import { createSupabaseServerClient } from "@/lib/supabase-client";

export async function ensureUserExists(userId?: string, email?: string) {
  try {
    // If no userId provided, try to get from session
    if (!userId) {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: "No authenticated user found" };
      }
      
      userId = user.id;
      email = user.email || email;
    }
    
    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (existingUser) {
      return { success: true, user: existingUser };
    }
    
    // User doesn't exist, need email to create
    if (!email) {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      email = user?.email;
    }
    
    if (!email) {
      return { success: false, error: "Email required to create user" };
    }
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        name: email.split("@")[0],
        updatedAt: new Date()
      }
    });
    
    // Initialize user points
    await prisma.userPoints.create({
      data: {
        userId: userId,
        balance: 1000,
        totalEarned: 1000,
        totalSpent: 0
      }
    });
    
    // Record initial grant transaction
    await prisma.pointsTransaction.create({
      data: {
        userId,
        type: "INITIAL_GRANT",
        amount: 1000,
        balance: 1000,
        description: "Welcome to V3RA! Here's 1000 points to get started"
      }
    });
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}