import React, { useState } from 'react';
import { 
  Home, 
  Bookmark, 
  Grid, 
  Sparkles, 
  User, 
  Tv, 
  Search, 
  X,
  ChevronRight
} from 'lucide-react';
import { Anime, MainTab } from '../types';

interface NavbarProps {
  currentTab: MainTab;
  setCurrentTab: (tab: MainTab) => void;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  userEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  animeList,
  onSelectAnime,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchResults = searchQuery.trim()
    ? animeList.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.japaneseTitle && a.japaneseTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        a.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  const handleResultClick = (anime: Anime) => {
    onSelectAnime(anime);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-black/95 border-b border-zinc-900 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          
          {/* Crunchyroll Brand Logo */}
          <button 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2 group focus:outline-none cursor-pointer"
          >
            {/* Orange Crescent Logo Icon */}
            <div className="w-8 h-8 rounded-full bg-[#FF640A] flex items-center justify-center p-1 relative shadow-md">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute -left-1 w-6 h-6 rounded-full bg-[#FF640A]"></div>
                <div className="absolute right-1 w-2.5 h-2.5 rounded-full bg-black"></div>
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white font-sans hidden sm:inline">
              Crunchyroll
            </span>
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <button
              onClick={() => setCurrentTab('home')}
              className={`transition-colors cursor-pointer ${currentTab === 'home' ? 'text-[#FF640A]' : 'text-zinc-300 hover:text-white'}`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentTab('lists')}
              className={`transition-colors cursor-pointer ${currentTab === 'lists' ? 'text-[#FF640A]' : 'text-zinc-300 hover:text-white'}`}
            >
              My Lists
            </button>
            <button
              onClick={() => setCurrentTab('browse')}
              className={`transition-colors cursor-pointer ${currentTab === 'browse' ? 'text-[#FF640A]' : 'text-zinc-300 hover:text-white'}`}
            >
              Browse
            </button>
            <button
              onClick={() => setCurrentTab('simulcasts')}
              className={`transition-colors cursor-pointer ${currentTab === 'simulcasts' ? 'text-[#FF640A]' : 'text-zinc-300 hover:text-white'}`}
            >
              Simulcasts
            </button>
            <button
              onClick={() => setCurrentTab('account')}
              className={`transition-colors cursor-pointer ${currentTab === 'account' ? 'text-[#FF640A]' : 'text-zinc-300 hover:text-white'}`}
            >
              Account
            </button>
          </nav>

          {/* Right Header Controls: Cast & Search */}
          <div className="flex items-center gap-3">
            {/* Chromecast Icon */}
            <button 
              className="p-1.5 text-zinc-300 hover:text-white cursor-pointer"
              title="Cast to TV"
              onClick={() => {
                // Cast devices detection
              }}
            >
              <Tv className="w-5 h-5" />
            </button>

            {/* Search Trigger / Input */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-full px-3 py-1 w-60 sm:w-72">
                  <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search titles, genres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}>
                    <X className="w-4 h-4 text-zinc-400 hover:text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-1.5 text-zinc-300 hover:text-white cursor-pointer"
                  title="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Search Results Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-md shadow-2xl overflow-hidden z-50">
                  <div className="px-3 py-2 text-[11px] font-bold uppercase text-zinc-400 bg-zinc-950 border-b border-zinc-800">
                    Results ({searchResults.length})
                  </div>
                  <div className="divide-y divide-zinc-800/60 max-h-80 overflow-y-auto">
                    {searchResults.map((anime) => (
                      <button
                        key={anime.id}
                        onClick={() => handleResultClick(anime)}
                        className="w-full text-left p-2.5 flex items-center gap-3 hover:bg-zinc-800 transition-colors"
                      >
                        <img
                          src={anime.coverImage}
                          alt={anime.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-14 object-cover rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate hover:text-[#FF640A]">
                            {anime.title}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {anime.genres.slice(0, 2).join(' • ')}
                          </p>
                          <span className="text-[10px] text-[#FF640A] font-medium">
                            ★ {anime.rating} • {anime.totalEpisodes} Eps
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Crunchyroll Exact Look) */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-black border-t border-zinc-900 md:hidden h-14 px-2">
        <div className="grid grid-cols-5 h-full max-w-md mx-auto items-center text-center">
          
          {/* 1. Home */}
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer ${
              currentTab === 'home' ? 'text-[#FF640A]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Home</span>
          </button>

          {/* 2. My Lists */}
          <button
            onClick={() => setCurrentTab('lists')}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer ${
              currentTab === 'lists' ? 'text-[#FF640A]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">My Lists</span>
          </button>

          {/* 3. Browse */}
          <button
            onClick={() => setCurrentTab('browse')}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer ${
              currentTab === 'browse' ? 'text-[#FF640A]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Browse</span>
          </button>

          {/* 4. Simulcasts */}
          <button
            onClick={() => setCurrentTab('simulcasts')}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer ${
              currentTab === 'simulcasts' ? 'text-[#FF640A]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Simulcasts</span>
          </button>

          {/* 5. Account */}
          <button
            onClick={() => setCurrentTab('account')}
            className={`flex flex-col items-center justify-center py-1 cursor-pointer ${
              currentTab === 'account' ? 'text-[#FF640A]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {/* Crunchyroll Orange Crescent Icon for Account tab */}
            <div className={`w-5 h-5 rounded-full flex items-center justify-center p-0.5 ${
              currentTab === 'account' ? 'bg-[#FF640A]' : 'bg-zinc-400'
            }`}>
              <div className="w-full h-full bg-black rounded-full relative overflow-hidden flex items-center justify-center">
                <div className={`absolute -left-0.5 w-4 h-4 rounded-full ${
                  currentTab === 'account' ? 'bg-[#FF640A]' : 'bg-zinc-400'
                }`}></div>
                <div className="absolute right-0.5 w-1.5 h-1.5 rounded-full bg-black"></div>
              </div>
            </div>
            <span className="text-[10px] font-medium mt-0.5">Account</span>
          </button>

        </div>
      </div>
    </>
  );
};
