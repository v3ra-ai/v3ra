'use client';

import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { Navbar } from '@/components/shared/navbar';
import { useUserPoints } from '@/hooks/useUserPoints';

export default function ExplorePage() {
  const { userPoints } = useUserPoints();
  
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent" />
      
      <Navbar userPoints={userPoints} />
      
      <div className="relative z-10 pt-20">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}