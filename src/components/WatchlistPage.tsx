import React, { useState } from 'react';
import { Bookmark, Crown, Play, Trash2, Plus, Clock, Download, ArrowRight } from 'lucide-react';
import { Anime, WatchlistItem, WatchProgress, MainTab } from '../types';

interface WatchlistPageProps {
  animeList: Anime[];
  watchlist: WatchlistItem[];
  watchProgress: WatchProgress[];
  onSelectAnime: (anime: Anime) => void;
  onPlayEpisode: (animeId: string, episodeNumber?: number) => void;
  onToggleWatchlist: (animeId: string) => void;
  setCurrentTab: (tab: MainTab) => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  animeList,
  watchlist,
  watchProgress,
  onSelectAnime,
  onPlayEpisode,
  onToggleWatchlist,
  setCurrentTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'watchlist' | 'crunchylists' | 'history' | 'downloads'>('watchlist');
  const [crunchylists, setCrunchylists] = useState([
    { id: 'cl-1', title: 'Top Shonen Anime', count: 4, cover: animeList[0]?.coverImage || '' },
    { id: 'cl-[#FF640A]', title: 'Late Night Binge', count: 2, cover: animeList[1]?.coverImage || '' }
  ]);
  const [newListName, setNewListName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter bookmarked anime
  const bookmarkedAnime = animeList.filter(a => watchlist.some(w => w.animeId === a.id));

  // Handle Crunchylist Creation
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCrunchylists([
      ...crunchylists,
      {
        id: `cl-${Date.now()}`,
        title: newListName.trim(),
        count: 0,
        cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80'
      }
    ]);
    setNewListName('');
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      
      {/* Sub-navigation Tabs */}
      <div className="border-b border-zinc-900 bg-black/90 sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 overflow-x-auto no-scrollbar">
          
          <button
            onClick={() => setActiveSubTab('watchlist')}
            className={`py-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'watchlist'
                ? 'border-[#FF640A] text-[#FF640A]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Watchlist
          </button>

          <button
            onClick={() => setActiveSubTab('crunchylists')}
            className={`py-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'crunchylists'
                ? 'border-[#FF640A] text-[#FF640A]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Crunchylists
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`py-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'history'
                ? 'border-[#FF640A] text-[#FF640A]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            History
          </button>

          <button
            onClick={() => setActiveSubTab('downloads')}
            className={`py-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'downloads'
                ? 'border-[#FF640A] text-[#FF640A]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Downloads
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </button>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 pt-6">

        {/* TAB 1: WATCHLIST */}
        {activeSubTab === 'watchlist' && (
          <div>
            {bookmarkedAnime.length === 0 ? (
              /* Empty State matching Screenshot 7 */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                
                {/* Vintage TV + Sleeping Cat Illustration */}
                <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                  <div className="w-36 h-28 bg-[#8B261D] rounded-xl relative shadow-2xl flex flex-col items-center justify-center p-2 border-4 border-zinc-900">
                    {/* TV Antenna */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <div className="w-0.5 h-8 bg-zinc-600 -rotate-12 transform origin-bottom"></div>
                      <div className="w-0.5 h-8 bg-zinc-600 rotate-12 transform origin-bottom"></div>
                    </div>
                    {/* TV Screen */}
                    <div className="w-full h-full bg-zinc-800 rounded-lg border-2 border-zinc-900 flex items-center justify-center overflow-hidden">
                      <div className="w-8 h-8 rounded-full border-2 border-zinc-700 opacity-40"></div>
                    </div>
                  </div>
                  {/* Cute sleeping cat on top */}
                  <div className="absolute -top-3 right-8 w-14 h-10 bg-zinc-400 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-zinc-700 -ml-2"></div>
                    <div className="w-2 h-2 rounded-full bg-zinc-700 ml-2"></div>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Your Watchlist needs some love.
                </h2>
                <p className="text-sm text-zinc-400 mt-2 max-w-sm">
                  Let's fill it up with awesome anime.
                </p>

                {/* Orange Pill Browse Button */}
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="mt-6 px-8 py-3 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-extrabold text-sm uppercase tracking-wide transition-transform hover:scale-105 shadow-lg cursor-pointer"
                >
                  Browse All
                </button>

              </div>
            ) : (
              /* Watchlist Grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {bookmarkedAnime.map((anime) => (
                  <div key={anime.id} className="group relative bg-zinc-900 rounded overflow-hidden">
                    <div 
                      onClick={() => onSelectAnime(anime)} 
                      className="aspect-[3/4] w-full relative cursor-pointer"
                    >
                      <img 
                        src={anime.coverImage} 
                        alt={anime.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayEpisode(anime.id, 1);
                        }}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#FF640A] text-black flex items-center justify-center">
                          <Play className="w-6 h-6 fill-black ml-0.5" />
                        </div>
                      </button>
                    </div>

                    <div className="p-3 flex items-start justify-between gap-1">
                      <div>
                        <h3 className="text-xs font-bold text-white truncate">{anime.title}</h3>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Dub | Sub</p>
                      </div>
                      <button
                        onClick={() => onToggleWatchlist(anime.id)}
                        className="p-1 text-zinc-400 hover:text-[#FF640A]"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CRUNCHYLISTS */}
        {activeSubTab === 'crunchylists' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">My Crunchylists</h2>
                <p className="text-xs text-zinc-400">Create custom collections of your favorite anime shows.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-full bg-[#FF640A] text-black font-extrabold text-xs uppercase flex items-center gap-1.5 hover:bg-[#e05300] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Crunchylist
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {crunchylists.map((cl) => (
                <div key={cl.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-4 hover:border-zinc-700 transition-colors">
                  <img src={cl.cover} alt={cl.title} className="w-16 h-20 object-cover rounded" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{cl.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{cl.count} items</p>
                    <button className="mt-2 text-xs text-[#FF640A] font-semibold hover:underline flex items-center gap-1">
                      View List <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HISTORY */}
        {activeSubTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Watch History</h2>
            {watchProgress.length === 0 ? (
              <p className="text-sm text-zinc-400">No watch history yet. Start watching anime episodes!</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {watchProgress.map((prog) => {
                  const targetAnime = animeList.find(a => a.id === prog.animeId);
                  if (!targetAnime) return null;
                  const pct = Math.min(100, Math.floor((prog.progressSeconds / (prog.durationSeconds || 1)) * 100));

                  return (
                    <div key={prog.episodeId} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={targetAnime.coverImage} alt={targetAnime.title} className="w-12 h-16 object-cover rounded shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{targetAnime.title}</h4>
                          <p className="text-[11px] text-[#FF640A] font-semibold">Episode {prog.episodeNumber}</p>
                          <div className="w-32 h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-[#FF640A]" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onPlayEpisode(targetAnime.id, prog.episodeNumber)}
                        className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-[#FF640A] hover:text-black text-xs font-bold transition-colors shrink-0"
                      >
                        Resume E{prog.episodeNumber}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DOWNLOADS */}
        {activeSubTab === 'downloads' && (
          <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <Download className="w-10 h-10 text-amber-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Offline Downloads</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Download your favorite anime episodes to watch offline anytime without an internet connection.
            </p>
            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
              PREMIUM FEATURE
            </span>
          </div>
        )}

      </div>

      {/* Modal for Creating New Crunchylist */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Crunchylist</h3>
            <form onSubmit={handleCreateList} className="space-y-4">
              <input
                type="text"
                placeholder="List Name (e.g., My Favorite Rom-Coms)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-[#FF640A]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF640A] text-black font-extrabold text-xs rounded-full uppercase"
                >
                  CREATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
