"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/ask/navbar/navbar";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { 
  Mail, 
  User, 
  Calendar, 
  Fingerprint,
  LogOut,
  Shield,
  Settings
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    created_at: string;
    user_metadata?: {
      username?: string;
    };
  } | null>(null);

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getInitials = (email: string, username?: string) => {
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Account Settings
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1 sm:mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 shadow-lg">
                  {getInitials(user?.email || '', user?.user_metadata?.username)}
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 break-all">
                  {user?.user_metadata?.username || user?.email?.split('@')[0]}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 break-all">
                  {user?.email}
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs sm:text-sm">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 sm:mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Account Information</span>
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Email Address
                    </label>
                    <p className="text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-medium break-all">
                      {user?.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Username
                    </label>
                    <p className="text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-medium break-all">
                      {user?.user_metadata?.username || 'Not set'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                  <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      User ID
                    </label>
                    <p className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 font-mono break-all">
                      {user?.id}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Member Since
                    </label>
                    <p className="text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 sm:mb-4">
                Account Actions
              </h3>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-sm sm:text-base hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}