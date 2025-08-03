"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AILoadingSpinner } from "@/components/ai-loading-spinner";
import { motion } from "framer-motion";
import { logger } from "@/lib/utils/client-logger";
import { 
  User, 
  Calendar, 
  LogOut,
  Trophy,
  Sparkles,
  TrendingUp,
  History,
  Award,
  Edit2,
  Check,
  X
} from "lucide-react";

interface PointHistory {
  amount: number;
  description: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<PointHistory[]>([]);
  const [stats, setStats] = useState({
    totalVotes: 0,
    currentStreak: 0,
    bestStreak: 0,
    accuracy: 0
  });
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      await checkUser();
      await loadUserData();
    };
    
    initializeUser();
  }, []);
  
  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Load user profile data
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUsername(profileData.user?.username || "");
        }
        
        // Load points
        const response = await fetch('/api/user/points');
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.balance || 0);
          setTotalEarned(data.totalEarned || 0);
          setPointsHistory(data.history || []);
        } else {
          logger.error('Failed to fetch user points', { status: response.status, statusText: response.statusText });
        }

        // For now, use mock stats
        setStats({
          totalVotes: 89,
          currentStreak: 3,
          bestStreak: 7,
          accuracy: 68
        });
      } else {
        logger.error('No user found when loading user data');
      }
    } catch (error) {
      logger.error('Failed to load user data', error);
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

  const handleEditUsername = () => {
    setEditingUsername(username);
    setIsEditingUsername(true);
    setUsernameError("");
  };

  const handleCancelEdit = () => {
    setIsEditingUsername(false);
    setEditingUsername("");
    setUsernameError("");
  };

  const handleSaveUsername = async () => {
    if (editingUsername === username) {
      setIsEditingUsername(false);
      return;
    }

    setSavingUsername(true);
    setUsernameError("");

    try {
      // First check if username is available
      const checkResponse = await fetch(`/api/user/username?username=${encodeURIComponent(editingUsername)}`);
      const checkData = await checkResponse.json();
      
      if (!checkData.available) {
        setUsernameError(checkData.error || "Username is not available");
        setSavingUsername(false);
        return;
      }

      // Update username
      const response = await fetch('/api/user/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: editingUsername })
      });

      const data = await response.json();

      if (!response.ok) {
        setUsernameError(data.error || "Failed to update username");
      } else {
        setUsername(data.user.username);
        setIsEditingUsername(false);
        setEditingUsername("");
      }
    } catch (error) {
      setUsernameError("Failed to update username");
    } finally {
      setSavingUsername(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <AILoadingSpinner message="Loading profile..." />
      </div>
    );
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar userPoints={userPoints} />
      
      {/* Profile Header */}
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            {/* Avatar */}
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.email ? getInitials(user.email) : 'U'}
            </div>
            
            {/* Username display/edit */}
            <div className="mb-2">
              {isEditingUsername ? (
                <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    value={editingUsername}
                    onChange={(e) => setEditingUsername(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-center focus:outline-none focus:border-purple-500"
                    placeholder="Choose a username"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveUsername();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveUsername}
                    disabled={savingUsername}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={savingUsername}
                    variant="outline"
                    className="border-white/20 hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                  {username || user?.email || 'User'}
                  <Button
                    size="sm"
                    onClick={handleEditUsername}
                    variant="ghost"
                    className="hover:bg-white/10 p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </h1>
              )}
              {usernameError && (
                <p className="text-red-400 text-sm mt-1">{usernameError}</p>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-4 text-white/60 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user?.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="bg-black/50 backdrop-blur border-white/10 p-6 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <p className="text-2xl font-bold text-white">{userPoints.toLocaleString()}</p>
              <p className="text-sm text-white/60">Current Points</p>
            </Card>
            
            <Card className="bg-black/50 backdrop-blur border-white/10 p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p className="text-2xl font-bold text-white">{stats.totalVotes}</p>
              <p className="text-sm text-white/60">Total Votes</p>
            </Card>
            
            <Card className="bg-black/50 backdrop-blur border-white/10 p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold text-white">{stats.currentStreak} days</p>
              <p className="text-sm text-white/60">Current Streak</p>
            </Card>
            
            <Card className="bg-black/50 backdrop-blur border-white/10 p-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-pink-400" />
              <p className="text-2xl font-bold text-white">{stats.accuracy}%</p>
              <p className="text-sm text-white/60">Vote Accuracy</p>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-black/50 backdrop-blur border-white/10 p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Activity
              </h2>
              
              {pointsHistory.length > 0 ? (
                <div className="space-y-3">
                  {pointsHistory.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-white/80">{item.description}</p>
                        <p className="text-xs text-white/40">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">+{item.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-8">No activity yet. Start voting to earn points!</p>
              )}
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-black/50 border-white/10 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
