import React, { useState, useEffect } from 'react';
import { X, Play, Star, Bookmark, Share2, Plus, Check, ChevronDown, Award, Download, ExternalLink, Volume2, Film, HardDriveDownload, CheckCircle2 } from 'lucide-react';
import { Anime, Episode, WatchlistItem } from '../types';
import { isEpisodeAvailableOffline, toggleEpisodeOffline, OFFLINE_CHANGE_EVENT } from '../lib/storage';

interface AnimeDetailModalProps {
  anime: Anime | null;
  episodes: Episode[];
  watchlist: WatchlistItem[];
  onClose: () => void;
  onPlayEpisode: (animeId: string, episodeNumber: number) => void;
  onToggleWatchlist: (animeId: string) => void;
}

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  anime,
  episodes,
  watchlist,
  onClose,
  onPlayEpisode,
  onToggleWatchlist,
}) => {
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('Season 1');
  const [offlineMap, setOfflineMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!anime) return;
    const updateOfflineMap = () => {
      const map: Record<string, boolean> = {};
      episodes.filter(ep => ep.animeId === anime.id).forEach(ep => {
        map[ep.id] = isEpisodeAvailableOffline(ep.id);
      });
      setOfflineMap(map);
    };

    updateOfflineMap();
    window.addEventListener(OFFLINE_CHANGE_EVENT, updateOfflineMap);
    return () => {
      window.removeEventListener(OFFLINE_CHANGE_EVENT, updateOfflineMap);
    };
  }, [anime, episodes]);

  const handleToggleOffline = (e: React.MouseEvent, ep: Episode) => {
    e.stopPropagation();
    if (!anime) return;
    const res = toggleEpisodeOffline(ep, anime);
    setOfflineMap(prev => ({
      ...prev,
      [ep.id]: res.isOffline
    }));
  };

  if (!anime) return null;

  const animeEpisodes = episodes
    .filter(ep => ep.animeId === anime.id)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

  const isInWatchlist = watchlist.some(w => w.animeId === anime.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto flex justify-center">
      <div className="relative w-full max-w-4xl bg-black min-h-screen text-white pb-20">
        
        {/* Top Close Bar */}
        <div className="sticky top-0 z-30 bg-gradient-to-b from-black/90 to-transparent p-4 flex justify-end">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white flex items-center justify-center transition-colors border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Background Cover matching Screenshot 12 */}
        <div className="relative w-full h-80 sm:h-96 -mt-16 overflow-hidden">
          <img
            src={anime.bannerImage || anime.coverImage}
            alt={anime.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="px-4 sm:px-8 -mt-20 relative z-10 space-y-4">
          
          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight drop-shadow-lg">
            {anime.title}
          </h1>

          {/* Award Badge if any */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full text-xs font-extrabold uppercase">
            <Award className="w-3.5 h-3.5" />
            2026 Anime Awards Nominee & Winner
          </div>

          {/* Content Rating & Tags matching Screenshot 12 */}
          <p className="text-xs text-zinc-300 font-medium flex flex-wrap items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-white">
              {anime.contentRating || 'U/A 16+'}
            </span>
            <span>•</span>
            <span className="text-[#FF640A] font-bold">Dub | Sub</span>
            <span>•</span>
            <span>{anime.genres.join(', ')}</span>
          </p>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
            <div className="flex text-amber-400">
              {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
            </div>
            <span className="text-white ml-1">Average: {anime.rating} ({anime.ratingCount || '457K'})</span>
          </div>

          {/* Secondary Action Buttons (+ My List & Share) */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => onToggleWatchlist(anime.id)}
              className={`px-4 py-2 rounded-full border text-xs font-extrabold uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                isInWatchlist
                  ? 'bg-[#FF640A] text-black border-[#FF640A]'
                  : 'bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800'
              }`}
            >
              {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isInWatchlist ? 'In Watchlist' : 'ADD TO MY LIST'}
            </button>

            <button
              onClick={() => {
                if (navigator.share) navigator.share({ title: anime.title, url: window.location.href });
              }}
              className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 text-xs font-extrabold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              SHARE
            </button>
          </div>

          {/* Synopsis */}
          <div className="pt-2">
            <p className={`text-xs sm:text-sm text-zinc-300 leading-relaxed ${showFullSynopsis ? '' : 'line-clamp-3'}`}>
              {anime.synopsis}
            </p>
            <button
              onClick={() => setShowFullSynopsis(!showFullSynopsis)}
              className="text-xs text-[#FF640A] font-extrabold uppercase mt-1 hover:underline cursor-pointer"
            >
              {showFullSynopsis ? 'SHOW LESS' : 'MORE DETAILS'}
            </button>
          </div>

          {/* Primary Orange Pill Button: Start Watching */}
          <div className="pt-2">
            <button
              onClick={() => onPlayEpisode(anime.id, 1)}
              className="w-full py-4 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-transform hover:scale-101 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-black ml-1" />
              START WATCHING E1
            </button>
          </div>

          {/* Episode List Header & Selector */}
          <div className="pt-8 border-t border-zinc-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Episodes</h3>
              <div className="flex items-center gap-1 text-xs text-zinc-400 font-bold bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
                <span>{selectedSeason}</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Episode Items List */}
            {animeEpisodes.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-4">No episodes uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {animeEpisodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <button
                      onClick={() => onPlayEpisode(anime.id, ep.episodeNumber)}
                      className="flex items-start sm:items-center gap-3.5 flex-1 text-left cursor-pointer"
                    >
                      <div className="relative w-28 sm:w-32 h-18 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                        <img
                          src={ep.thumbnailUrl || anime.coverImage}
                          alt={ep.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = anime.coverImage;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                          <div className="w-8 h-8 rounded-full bg-[#FF640A] text-black flex items-center justify-center shadow-md">
                            <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                          </div>
                        </div>
                        {ep.quality && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-[9px] font-black text-[#FF640A] rounded">
                            {ep.quality}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-black text-[#FF640A] uppercase tracking-wider">
                            Episode {ep.episodeNumber}
                          </span>
                          {ep.seasonName && (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                              {ep.seasonName}
                            </span>
                          )}
                          {ep.language && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-900/60 flex items-center gap-1">
                              <Volume2 className="w-2.5 h-2.5" />
                              {ep.language}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FF640A] transition-colors line-clamp-1">
                          {ep.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                          {ep.synopsis || 'Full HD complete combined anime episode file with high fidelity audio and subtitles.'}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Available Offline Toggle Button */}
                      <button
                        onClick={(e) => handleToggleOffline(e, ep)}
                        className={`px-2.5 py-1.5 rounded-full border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          offlineMap[ep.id]
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30 shadow'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                        title={offlineMap[ep.id] ? "ऑफ़लाइन उपलब्ध है (हटाने के लिए क्लिक करें)" : "बिना इंटरनेट देखने के लिए ऑफ़लाइन सेव करें (Save Offline)"}
                      >
                        <HardDriveDownload className={`w-3.5 h-3.5 ${offlineMap[ep.id] ? 'text-emerald-400' : 'text-zinc-400'}`} />
                        <span className="hidden md:inline">{offlineMap[ep.id] ? 'ऑफ़लाइन ✓' : 'ऑफ़लाइन'}</span>
                      </button>

                      <button
                        onClick={() => onPlayEpisode(anime.id, ep.episodeNumber)}
                        className="px-3 py-1.5 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-extrabold text-[11px] uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        Play
                      </button>

                      <a
                        href={ep.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        title="Download or Stream directly in external media player (VLC, MX Player)"
                        className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-zinc-300" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
