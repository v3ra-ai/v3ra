"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { 
  Mail, 
  User, 
  Calendar, 
  Fingerprint,
  LogOut,
  Shield,
  Settings,
  Activity,
  Coins,
  TrendingUp,
  Download,
  Trash2,
  History,
  Award
} from "lucide-react";
import { UserFavorites } from "@/components/profile/user-favorites";

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
  const [userPoints, setUserPoints] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<{
    amount: number;
    description: string;
    createdAt: string;
  }[]>([]);

  useEffect(() => {
    checkUser();
    loadUserPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const loadUserPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const response = await fetch(`/api/user/points?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.balance || 0);
          setTotalEarned(data.totalEarned || 0);
          setPointsHistory(data.history || []);
        }
      }
    } catch (error) {
      console.error('Failed to load user points:', error);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
    } catch {
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar userPoints={userPoints} />
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
              <div className="space-y-3">
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
            
            {/* Data Management */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 sm:mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>Data & Privacy</span>
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-sm sm:text-base"
                  onClick={() => alert('Export feature coming soon!')}
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Export My Data
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-sm sm:text-base hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      alert('Account deletion feature coming soon!');
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Delete Account
                </Button>
              </div>
              <p className="text-xs text-zinc-500 mt-4">
                Your data belongs to you. Export your data anytime or permanently delete your account.
              </p>
            </div>
            
            {/* V3RA Token Stats */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 sm:mb-4 flex items-center gap-2">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-yellow-400" />
                <span>V3RA Token Balance</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-lg p-4 border border-yellow-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Current Balance</p>
                      <p className="text-2xl font-bold text-yellow-400">{userPoints.toLocaleString()}</p>
                    </div>
                    <Coins className="w-8 h-8 text-yellow-400/20" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Earned</p>
                      <p className="text-2xl font-bold text-green-400">{totalEarned.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-400/20" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Win Rate</p>
                      <p className="text-2xl font-bold text-purple-400">68%</p>
                    </div>
                    <Award className="w-8 h-8 text-purple-400/20" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 sm:mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Recent Activity</span>
                </h3>
                
                <div className="space-y-2">
                  {pointsHistory.length > 0 ? pointsHistory.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${
                        transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} V3RA
                      </span>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-zinc-500">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No recent activity</p>
                      <p className="text-xs mt-1">Start making predictions to see your history</p>
                    </div>
                  )}
                </div>
                
                {pointsHistory.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-sm"
                    onClick={() => router.push('/activity')}
                  >
                    View All Activity
                  </Button>
                )}
              </div>
          </div>
        </div>

        {/* Favorites Section */}
        <div className="mt-6 sm:mt-8">
          <UserFavorites />
        </div>
      </div>
    </div>
  );
}