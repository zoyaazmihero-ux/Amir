import React, { useState } from 'react';
import { SlidersHorizontal, ArrowUpDown, Search, Filter } from 'lucide-react';
import { Anime, WatchlistItem, MainTab } from '../types';
import { AnimeCard } from './AnimeCard';

interface BrowseCatalogProps {
  animeList: Anime[];
  watchlist: WatchlistItem[];
  onSelectAnime: (anime: Anime) => void;
  onPlayEpisode: (animeId: string, epNum?: number) => void;
  onToggleWatchlist: (animeId: string) => void;
  setCurrentTab: (tab: MainTab) => void;
}

export const BrowseCatalog: React.FC<BrowseCatalogProps> = ({
  animeList,
  watchlist,
  onSelectAnime,
  onPlayEpisode,
  onToggleWatchlist,
  setCurrentTab,
}) => {
  const [subTab, setSubTab] = useState<'all' | 'simulcasts' | 'genres' | 'music'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'title'>('popular');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const genresList = [
    'All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
    'Isekai', 'Music', 'Romance', 'Sci-Fi', 'Shonen', 'Slice of Life', 'Supernatural'
  ];

  // Filter & Sort Logic
  let filtered = animeList.filter(a => {
    if (subTab === 'music' && !a.genres.includes('Music')) return false;
    if (selectedGenre !== 'All' && !a.genres.includes(selectedGenre as any)) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'popular') return b.views - a.views;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'newest') return b.releaseYear - a.releaseYear;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      
      {/* Sub-Navigation Header */}
      <div className="border-b border-zinc-900 bg-black sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => { setSubTab('all'); setSelectedGenre('All'); }}
              className={`py-3.5 text-xs font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                subTab === 'all' ? 'border-[#FF640A] text-[#FF640A]' : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              All Anime
            </button>

            <button
              onClick={() => setCurrentTab('simulcasts')}
              className="py-3.5 text-xs font-extrabold uppercase tracking-wider border-b-2 border-transparent text-zinc-400 hover:text-white whitespace-nowrap cursor-pointer"
            >
              Simulcasts
            </button>

            <button
              onClick={() => { setSubTab('genres'); }}
              className={`py-3.5 text-xs font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                subTab === 'genres' ? 'border-[#FF640A] text-[#FF640A]' : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Anime Genres
            </button>

            <button
              onClick={() => { setSubTab('music'); }}
              className={`py-3.5 text-xs font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                subTab === 'music' ? 'border-[#FF640A] text-[#FF640A]' : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Music
            </button>
          </div>

          {/* Filter / Sort Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterModal(!showFilterModal)}
              className="p-2 text-zinc-300 hover:text-[#FF640A] transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Browse Container */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        
        {/* Genre Pill Selection Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-4 border-b border-zinc-900">
          {genresList.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === g
                  ? 'bg-[#FF640A] text-black shadow'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Results Counter & Sort bar */}
        <div className="flex items-center justify-between mb-6 text-xs text-zinc-400 font-semibold">
          <span>Showing {filtered.length} Anime Shows</span>
          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#FF640A] cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Release Year</option>
              <option value="title">Alphabetical A-Z</option>
            </select>
          </div>
        </div>

        {/* Anime Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filtered.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              watchlist={watchlist}
              onSelectAnime={onSelectAnime}
              onPlayEpisode={onPlayEpisode}
              onToggleWatchlist={onToggleWatchlist}
            />
          ))}
        </div>

      </div>

    </div>
  );
};
