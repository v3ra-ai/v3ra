import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: ["query", "error"],
});

// Supabase client for real-time subscriptions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dmrylpiaazevwqxcucsr.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-anon-key";
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: {
    params: {
      minimal: true,
    },
  },
});