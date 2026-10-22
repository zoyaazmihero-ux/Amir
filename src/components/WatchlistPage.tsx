import React, { useState, useEffect } from 'react';
import { Bookmark, Crown, Play, Trash2, Plus, Clock, Download, ArrowRight, HardDriveDownload, CheckCircle2, WifiOff } from 'lucide-react';
import { Anime, WatchlistItem, WatchProgress, MainTab, OfflineEpisode } from '../types';
import { 
  getOfflineEpisodes, 
  removeOfflineEpisode, 
  clearAllOfflineEpisodes, 
  getOfflineStorageEstimate, 
  OFFLINE_CHANGE_EVENT 
} from '../lib/storage';

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
  const [offlineEpisodes, setOfflineEpisodes] = useState<OfflineEpisode[]>(getOfflineEpisodes);
  const [offlineStorageInfo, setOfflineStorageInfo] = useState(getOfflineStorageEstimate);

  useEffect(() => {
    const syncOffline = () => {
      setOfflineEpisodes(getOfflineEpisodes());
      setOfflineStorageInfo(getOfflineStorageEstimate());
    };
    syncOffline();
    window.addEventListener(OFFLINE_CHANGE_EVENT, syncOffline);
    return () => {
      window.removeEventListener(OFFLINE_CHANGE_EVENT, syncOffline);
    };
  }, []);
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

        {/* TAB 4: OFFLINE DOWNLOADS & CACHED EPISODES */}
        {activeSubTab === 'downloads' && (
          <div className="space-y-6">
            
            {/* Storage Header & Stats */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <HardDriveDownload className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Available Offline (ऑफ़लाइन उपलब्ध)
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                      Cached in LocalStorage
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {offlineStorageInfo.totalCount > 0 
                      ? `${offlineStorageInfo.totalCount} episodes saved • ~${offlineStorageInfo.formattedSize} storage used` 
                      : 'Episodes marked as available offline will appear here for viewing without an active internet connection.'}
                  </p>
                </div>
              </div>

              {offlineStorageInfo.totalCount > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('क्या आप सभी ऑफ़लाइन कैश्ड एपिसोड्स को हटाना चाहते हैं?')) {
                      clearAllOfflineEpisodes();
                    }
                  }}
                  className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-red-950/60 hover:text-red-300 hover:border-red-800 border border-zinc-800 text-xs font-bold transition-all text-zinc-400 self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Offline Cache
                </button>
              )}
            </div>

            {/* Offline Episodes List */}
            {offlineEpisodes.length === 0 ? (
              <div className="p-10 text-center bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-4">
                <HardDriveDownload className="w-12 h-12 text-zinc-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">No Offline Episodes Yet</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    When watching an episode or browsing series details, click <span className="text-emerald-400 font-bold">"ऑफ़लाइन सेव करें"</span> to save it for viewing without an active internet connection.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="px-5 py-2.5 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-black text-xs uppercase transition-all shadow-lg cursor-pointer"
                >
                  Browse Anime to Save
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {offlineEpisodes.map((item) => {
                  const targetAnime = animeList.find(a => a.id === item.animeId);
                  const formattedMins = Math.floor(item.duration / 60);

                  return (
                    <div
                      key={item.episodeId}
                      className="p-3.5 sm:p-4 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        {/* Thumbnail */}
                        <div 
                          onClick={() => onPlayEpisode(item.animeId, item.episodeNumber)}
                          className="relative w-28 sm:w-36 h-20 rounded-lg overflow-hidden bg-zinc-900 shrink-0 cursor-pointer"
                        >
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                            <div className="w-8 h-8 rounded-full bg-[#FF640A] text-black flex items-center justify-center shadow-md">
                              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/85 text-[9px] font-black text-emerald-400 rounded border border-emerald-900/50 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Offline
                          </span>
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[11px] font-black text-[#FF640A] uppercase tracking-wide">
                              {item.animeTitle} • Ep {item.episodeNumber}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-400 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                              {item.quality || '1080P Full HD'}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-900/60">
                              {item.language || 'Multi-Audio'}
                            </span>
                          </div>

                          <h4 
                            onClick={() => onPlayEpisode(item.animeId, item.episodeNumber)}
                            className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FF640A] transition-colors line-clamp-1 cursor-pointer"
                          >
                            {item.title}
                          </h4>

                          <p className="text-[11px] text-zinc-400 flex items-center gap-3 mt-1">
                            <span>⏱️ {formattedMins} mins</span>
                            <span>📦 ~{Math.round((item.estimatedSizeBytes || 350 * 1024 * 1024) / (1024 * 1024))} MB</span>
                            <span className="hidden md:inline">Saved {new Date(item.markedOfflineAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => onPlayEpisode(item.animeId, item.episodeNumber)}
                          className="px-4 py-2 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-extrabold text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                        >
                          <Play className="w-3.5 h-3.5 fill-black" />
                          Watch Offline
                        </button>

                        <button
                          onClick={() => removeOfflineEpisode(item.episodeId)}
                          className="p-2 rounded-full bg-zinc-900 hover:bg-red-950 hover:text-red-400 text-zinc-400 border border-zinc-800 transition-colors cursor-pointer"
                          title="Remove from Offline Cache"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
