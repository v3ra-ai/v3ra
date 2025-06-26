"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/ask/navbar/navbar";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner-new";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <LoadingSpinner type="beat" message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-8">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-6">
            Profile
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Email
              </label>
              <p className="text-zinc-800 dark:text-zinc-200">
                {user?.email}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Username
              </label>
              <p className="text-zinc-800 dark:text-zinc-200">
                {user?.user_metadata?.username || 'Not set'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                User ID
              </label>
              <p className="text-zinc-800 dark:text-zinc-200 font-mono text-sm">
                {user?.id}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Member Since
              </label>
              <p className="text-zinc-800 dark:text-zinc-200">
                {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}