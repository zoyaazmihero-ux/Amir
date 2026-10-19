import React, { useState } from 'react';
import { ChevronDown, Check, X, Sparkles } from 'lucide-react';
import { Anime, WatchlistItem } from '../types';
import { AnimeCard } from './AnimeCard';

interface SimulcastsPageProps {
  animeList: Anime[];
  watchlist: WatchlistItem[];
  onSelectAnime: (anime: Anime) => void;
  onPlayEpisode: (animeId: string, epNum?: number) => void;
  onToggleWatchlist: (animeId: string) => void;
}

export const SimulcastsPage: React.FC<SimulcastsPageProps> = ({
  animeList,
  watchlist,
  onSelectAnime,
  onPlayEpisode,
  onToggleWatchlist,
}) => {
  const [selectedSeason, setSelectedSeason] = useState('Summer 2026');
  const [showSeasonModal, setShowSeasonModal] = useState(false);

  // Full list of seasons matching Crunchyroll screenshots 3, 4, 5, 6, 13
  const seasonsList = [
    'Summer 2026', 'Spring 2026', 'Winter 2026',
    'Fall 2025', 'Summer 2025', 'Spring 2025', 'Winter 2025',
    'Fall 2024', 'Summer 2024', 'Spring 2024', 'Winter 2024',
    'Fall 2023', 'Summer 2023', 'Spring 2023', 'Winter 2023',
    'Fall 2022', 'Summer 2022', 'Spring 2022', 'Winter 2022',
    'Fall 2021', 'Summer 2021', 'Spring 2021', 'Winter 2021',
    'Fall 2020', 'Summer 2020', 'Spring 2020', 'Winter 2020',
    'Fall 2019', 'Summer 2019', 'Spring 2019', 'Winter 2019',
    'Fall 2018', 'Summer 2018', 'Spring 2018', 'Winter 2018',
    'Fall 2017', 'Summer 2017', 'Spring 2017', 'Winter 2017',
    'Fall 2016', 'Summer 2016', 'Spring 2016', 'Winter 2016',
    'Fall 2015', 'Summer 2015', 'Spring 2015', 'Winter 2015',
    'Fall 2014', 'Summer 2014', 'Spring 2014', 'Winter 2014',
    'Fall 2013', 'Summer 2013', 'Spring 2013', 'Winter 2013',
    'Fall 2012', 'Summer 2012', 'Spring 2012', 'Winter 2012',
    'Fall 2011', 'Summer 2011', 'Spring 2011', 'Winter 2011',
    'Fall 2010', 'Summer 2010', 'Spring 2010', 'Winter 2010',
    'Fall 2009', 'Summer 2009', 'Spring 2009', 'Winter 2009',
  ];

  // Filter shows for season
  const simulcastAnime = animeList.filter(a => a.status === 'Ongoing' || a.releaseYear >= 2025);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      
      {/* Season Selector Dropdown Header */}
      <div className="border-b border-zinc-900 bg-black/95 sticky top-14 z-20 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setShowSeasonModal(true)}
            className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-white hover:text-[#FF640A] transition-colors cursor-pointer"
          >
            <span>{selectedSeason}</span>
            <ChevronDown className="w-5 h-5 text-[#FF640A]" />
          </button>

          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FF640A]" />
            New Episodes Weekly
          </span>
        </div>
      </div>

      {/* Main Simulcasts Content */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <p className="text-xs text-zinc-400 mb-6">
          Watch latest simulcasting anime episodes fresh from Japan with English, Hindi, and regional dubs/subs.
        </p>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {simulcastAnime.map((anime) => (
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

      {/* Full Screen / Modal Season Selector matching Screenshots 3-6 & 13 */}
      {showSeasonModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="max-w-lg mx-auto p-4 sm:p-6 min-h-screen flex flex-col">
            
            <div className="flex items-center justify-between py-4 border-b border-zinc-800">
              <h2 className="text-lg font-extrabold text-white uppercase tracking-wider">Select Season</h2>
              <button
                onClick={() => setShowSeasonModal(false)}
                className="p-2 text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="divide-y divide-zinc-800/60 py-2 flex-1">
              {seasonsList.map((season) => {
                const isSelected = season === selectedSeason;
                return (
                  <button
                    key={season}
                    onClick={() => {
                      setSelectedSeason(season);
                      setShowSeasonModal(false);
                    }}
                    className={`w-full py-3.5 px-3 text-left font-bold text-sm flex items-center justify-between hover:bg-zinc-900 transition-colors cursor-pointer ${
                      isSelected ? 'text-[#FF640A]' : 'text-zinc-200'
                    }`}
                  >
                    <span>{season}</span>
                    {isSelected && <Check className="w-5 h-5 text-[#FF640A]" />}
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
