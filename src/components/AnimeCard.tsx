import React, { useState } from 'react';
import { MoreVertical, Bookmark, Check, Share2, Play } from 'lucide-react';
import { Anime, WatchlistItem } from '../types';

interface AnimeCardProps {
  anime: Anime;
  watchlist: WatchlistItem[];
  onSelectAnime: (anime: Anime) => void;
  onPlayEpisode: (animeId: string, epNum?: number) => void;
  onToggleWatchlist: (animeId: string) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  watchlist,
  onSelectAnime,
  onPlayEpisode,
  onToggleWatchlist,
}) => {
  const isInWatchlist = watchlist.some(w => w.animeId === anime.id);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div 
      className="group relative flex flex-col cursor-pointer select-none"
      onClick={() => onSelectAnime(anime)}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900 rounded-sm">
        <img
          src={anime.coverImage}
          alt={anime.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80';
          }}
          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300 bg-zinc-900"
        />

        {/* Hover overlay with subtle play button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onPlayEpisode(anime.id, 1);
            }}
            className="w-12 h-12 rounded-full bg-[#FF640A] text-black flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform"
          >
            <Play className="w-6 h-6 fill-black ml-1" />
          </div>
        </div>

        {/* Quick Watchlist Bookmark Ribbon in Top Right */}
        {isInWatchlist && (
          <div className="absolute top-0 right-2 w-6 h-8 bg-[#FF640A] flex items-center justify-center shadow-md clip-ribbon">
            <Bookmark className="w-3.5 h-3.5 fill-black text-black" />
          </div>
        )}
      </div>

      {/* Info Below Poster */}
      <div className="mt-2 flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white group-hover:text-[#FF640A] transition-colors truncate leading-tight">
            {anime.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">
            {anime.isDubbedHindi ? 'Dubbed हिंदी' : 'Dub | Sub'}
          </p>
        </div>

        {/* 3 Dots Menu Button */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-zinc-400 hover:text-white transition-colors rounded-full"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Quick Menu Popover */}
          {showMenu && (
            <div 
              className="absolute right-0 bottom-full mb-1 w-44 bg-zinc-900 border border-zinc-800 rounded shadow-2xl py-1 z-50 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onToggleWatchlist(anime.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isInWatchlist ? 'fill-[#FF640A] text-[#FF640A]' : ''}`} />
                {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              </button>
              <button
                onClick={() => {
                  onPlayEpisode(anime.id, 1);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Watching
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: anime.title, url: window.location.href });
                  }
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
