import React, { useState, useEffect } from 'react';
import { Play, Bookmark, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Anime, WatchlistItem } from '../types';

interface HeroCarouselProps {
  animeList: Anime[];
  watchlist: WatchlistItem[];
  onPlayEpisode: (animeId: string, episodeNumber?: number) => void;
  onOpenDetails: (anime: Anime) => void;
  onToggleWatchlist: (animeId: string) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  animeList,
  watchlist,
  onPlayEpisode,
  onOpenDetails,
  onToggleWatchlist,
}) => {
  const featuredItems = animeList.filter(a => a.isFeatured || a.isTrending).slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featuredItems.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredItems.length]);

  if (!featuredItems.length) return null;
  const currentAnime = featuredItems[currentIndex] || featuredItems[0];
  const isInWatchlist = watchlist.some(w => w.animeId === currentAnime.id);

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] bg-black overflow-hidden group select-none">
      
      {/* Background Hero Banner with Gradients */}
      <div className="absolute inset-0">
        <img
          src={currentAnime.bannerImage || currentAnime.coverImage}
          alt={currentAnime.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-opacity duration-700 opacity-70"
        />
        {/* Shadow overlays matching Crunchyroll app */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent w-full md:w-3/4" />
      </div>

      {/* Main Hero Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-8 flex flex-col justify-end pb-8 z-10">
        
        {/* Title in Bold Crisp Typography */}
        <h1 
          onClick={() => onOpenDetails(currentAnime)}
          className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight max-w-2xl drop-shadow-lg cursor-pointer hover:text-[#FF640A] transition-colors"
        >
          {currentAnime.title}
        </h1>

        {/* Crunchyroll Subtitle Metadata */}
        <p className="text-xs sm:text-sm font-medium text-zinc-300 mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[#FF640A] font-bold">Series</span>
          <span>•</span>
          <span>Dub | Sub</span>
          <span>•</span>
          <span>{currentAnime.genres.slice(0, 4).join(', ')}</span>
        </p>

        {/* Brief Synopsis */}
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mt-2 line-clamp-2 leading-relaxed">
          {currentAnime.synopsis}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-5">
          {/* Large Orange Pill Start Watching Button */}
          <button
            onClick={() => onPlayEpisode(currentAnime.id, 1)}
            className="px-6 py-3 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all transform hover:scale-105 cursor-pointer shadow-lg"
          >
            <Play className="w-4 h-4 fill-black" />
            START WATCHING E1
          </button>

          {/* Bookmark Circle Button */}
          <button
            onClick={() => onToggleWatchlist(currentAnime.id)}
            className={`w-11 h-11 rounded-full border border-zinc-700 flex items-center justify-center transition-all cursor-pointer ${
              isInWatchlist
                ? 'bg-[#FF640A] text-black border-[#FF640A]'
                : 'bg-black/60 text-white hover:bg-zinc-800'
            }`}
            title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            {isInWatchlist ? <Check className="w-5 h-5 text-black" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        {/* Slide Progress Indicator Bar */}
        <div className="flex items-center gap-2 mt-6">
          {featuredItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-8 bg-[#FF640A]' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>

      </div>

      {/* Manual Slide Controls */}
      <button
        onClick={() => setCurrentIndex((currentIndex - 1 + featuredItems.length) % featuredItems.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => setCurrentIndex((currentIndex + 1) % featuredItems.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

    </div>
  );
};
