"use client";

import { useEffect, useState } from "react";
import { Heart, ExternalLink, Calendar, TrendingUp } from "lucide-react";
import { fetchUserFavorites } from "@/app/actions";
import { Favorite, VoteResult } from "@/lib/types";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";

interface FavoriteWithVoteSession extends Favorite {
  voteSession?: VoteResult;
}

export function UserFavorites() {
  const [favorites, setFavorites] = useState<FavoriteWithVoteSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const result = await fetchUserFavorites();
      
      if (Array.isArray(result)) {
        // Fetch vote session details for each favorite
        const favoritesWithDetails = await Promise.all(
          result.map(async (fav) => {
            const response = await fetch(`/api/vote-session/${fav.vote_session_id}`);
            if (response.ok) {
              const voteSession = await response.json();
              return { ...fav, voteSession };
            }
            return fav;
          })
        );
        setFavorites(favoritesWithDetails);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-zinc-900/80 via-black/80 to-zinc-950/80 backdrop-blur-xl rounded-xl shadow-lg border border-zinc-700/50 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner type="pulse" message="Loading favorites..." />
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="bg-gradient-to-br from-zinc-900/80 via-black/80 to-zinc-950/80 backdrop-blur-xl rounded-xl shadow-lg border border-zinc-700/50 p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-cyan-400" />
          <span className="text-cyan-400">Favorite</span> Truth Reports
        </h3>
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No favorites yet</p>
          <p className="text-sm text-zinc-500 mt-2">
            Star truth report cards to save them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900/80 via-black/80 to-zinc-950/80 backdrop-blur-xl rounded-xl shadow-lg border border-zinc-700/50 p-6">
      <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-cyan-400" />
        <span className="text-cyan-400">Favorite</span> Truth Reports
        <span className="text-sm text-zinc-500 ml-auto">{favorites.length} saved</span>
      </h3>
      
      <div className="space-y-3">
        {favorites.map((favorite) => (
          <Link
            key={favorite.id}
            href={`/ask/${favorite.vote_session_id}`}
            className="block group"
          >
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/30 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.1)] hover:bg-zinc-800/70">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-zinc-100 font-medium group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {favorite.voteSession?.queryText || "Loading..."}
                  </h4>
                  
                  {favorite.voteSession && (
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        favorite.voteSession.isConsensusReached
                          ? favorite.voteSession.consensusValue
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/50"
                      }`}>
                        {favorite.voteSession.isConsensusReached
                          ? favorite.voteSession.consensusValue
                            ? "TRUE"
                            : "FALSE"
                          : "NO CONSENSUS"}
                      </span>
                      
                      <div className="flex items-center gap-1 text-zinc-500">
                        <TrendingUp className="w-3 h-3" />
                        <span>{favorite.voteSession.votingResult?.yes || 0} yes</span>
                        <span>/</span>
                        <span>{favorite.voteSession.votingResult?.no || 0} no</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mt-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Saved {new Date(favorite.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 transition-colors flex-shrink-0 ml-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}