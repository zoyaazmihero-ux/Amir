import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Sparkles, 
  Star, 
  Tv, 
  ArrowRight, 
  Crown, 
  Play, 
  Plus, 
  Bookmark, 
  Clock,
  Heart,
  ChevronRight
} from 'lucide-react';
import { Anime, Episode, WatchlistItem, WatchProgress, MainTab } from './types';
import { 
  getStoredAnimeList, 
  getStoredEpisodes, 
  getWatchlist, 
  getWatchProgress, 
  toggleWatchlist,
  addAnimeSeries,
  addEpisode
} from './lib/storage';
import { Navbar } from './components/Navbar';
import { HeroCarousel } from './components/HeroCarousel';
import { AnimeCard } from './components/AnimeCard';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { WatchView } from './components/WatchView';
import { BrowseCatalog } from './components/BrowseCatalog';
import { WatchlistPage } from './components/WatchlistPage';
import { SimulcastsPage } from './components/SimulcastsPage';
import { AccountPage } from './components/AccountPage';
import { AuthModal } from './components/AuthModal';
import { UploaderModal } from './components/UploaderModal';
import { RenderDeployModal } from './components/RenderDeployModal';
import { Rocket } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<MainTab>('home');
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchProgress, setWatchProgress] = useState<WatchProgress[]>([]);

  // Auth & Account state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('bratheronlinework@gmail.com');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploaderModal, setShowUploaderModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  // Selected anime for detail modal
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  // Active watching session
  const [activeWatching, setActiveWatching] = useState<{ anime: Anime; epNum: number } | null>(null);

  // Load stored data on mount
  useEffect(() => {
    setAnimeList(getStoredAnimeList());
    setEpisodes(getStoredEpisodes());
    setWatchlist(getWatchlist());
    setWatchProgress(getWatchProgress());
  }, []);

  // Sync state
  useEffect(() => {
    setWatchlist(getWatchlist());
    setWatchProgress(getWatchProgress());
  }, [currentTab, activeWatching]);

  const handleToggleWatchlist = (animeId: string) => {
    const updated = toggleWatchlist(animeId, 'Watching');
    setWatchlist(updated);
  };

  const handlePlayEpisode = (animeId: string, epNum: number = 1) => {
    const targetAnime = animeList.find(a => a.id === animeId);
    if (targetAnime) {
      setSelectedAnime(null);
      setActiveWatching({ anime: targetAnime, epNum });
    }
  };

  const handleAddAnimeSeries = (newAnime: Anime) => {
    const updated = addAnimeSeries(newAnime);
    setAnimeList(updated);
  };

  const handleAddEpisode = (newEpisode: Episode) => {
    const updated = addEpisode(newEpisode);
    setEpisodes(updated);
  };

  // Content Row Categories matching Crunchyroll UI
  const popularShows = [...animeList].sort((a, b) => b.views - a.views);
  const hindiDubbedShows = animeList.filter(a => a.isDubbedHindi);
  const koreanSeries = animeList.filter(a => 
    /korean|k-drama|korea|오징어|나 혼자만|외मो지상주의|지금 우리 학교는|스위트홈|신의 탑|갓 오브 하이스쿨/i.test(a.japaneseTitle || '') ||
    /korean|solo leveling|squid game|lookism|all of us are dead|tower of god|god of high school|sweet home/i.test(a.title) ||
    /korean|k-drama|webtoon/i.test(a.synopsis)
  );
  const blockbusterMovies = animeList.filter(a => a.type === 'Movie');
  const newSeasonShows = animeList.filter(a => a.status === 'Ongoing' || a.releaseYear >= 2026);
  const topPicks = [...animeList].sort((a, b) => b.rating - a.rating);
  const romComFix = animeList.filter(a => a.genres.includes('Romance') || a.genres.includes('Comedy') || a.genres.includes('Slice of Life'));
  const whiteHaired = animeList.filter(a => a.genres.includes('Fantasy') || a.genres.includes('Supernatural') || a.genres.includes('Action'));
  const soccerLegends = animeList.filter(a => a.title.toLowerCase().includes('blue') || a.genres.includes('Sports') || a.genres.includes('Shonen'));

  // If currently watching a video
  if (activeWatching) {
    return (
      <WatchView
        anime={activeWatching.anime}
        episodes={episodes.filter(e => e.animeId === activeWatching.anime.id)}
        initialEpisodeNumber={activeWatching.epNum}
        onBack={() => setActiveWatching(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none">
      
      {/* Top Header & Bottom Nav */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => setCurrentTab(tab)}
        animeList={animeList}
        onSelectAnime={(anime) => setSelectedAnime(anime)}
        userEmail={userEmail}
        onOpenDeployModal={() => setShowDeployModal(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        
        {/* TAB 1: HOME VIEW */}
        {currentTab === 'home' && (
          <div className="space-y-8 pb-20">
            
            {/* Featured Hero Banner Carousel */}
            <HeroCarousel
              animeList={animeList}
              watchlist={watchlist}
              onPlayEpisode={handlePlayEpisode}
              onOpenDetails={(anime) => setSelectedAnime(anime)}
              onToggleWatchlist={handleToggleWatchlist}
            />

            {/* Golden "Go Premium" Banner matching Screenshots */}
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <button 
                onClick={() => setCurrentTab('account')}
                className="md:col-span-2 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between shadow-xl hover:brightness-105 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-5 h-5 fill-black" />
                  <span>GO PREMIUM • TRY 14 DAYS FREE TRIAL</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline font-bold">START TRIAL</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>

              {/* Render Quick Deploy Banner */}
              <button
                onClick={() => setShowDeployModal(true)}
                className="py-3 px-5 rounded-xl bg-gradient-to-r from-zinc-900 to-black border border-[#FF640A]/40 hover:border-[#FF640A] text-white font-extrabold text-xs flex items-center justify-between shadow-lg shadow-orange-500/10 group cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#FF640A] flex items-center justify-center text-black">
                    <Rocket className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-white group-hover:text-[#FF640A] transition-colors">
                      Deploy on Render
                    </p>
                    <p className="text-[10px] text-zinc-400 font-normal">
                      1-Click Hosting Guide & Config
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Ready
                </span>
              </button>
            </div>

            {/* Special Row: Korean Series & K-Dramas */}
            {koreanSeries.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                      🇰🇷 Korean Series & K-Dramas
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#FF640A]/20 text-[#FF640A] border border-[#FF640A]/30 text-[10px] font-black uppercase">
                      Korean Hits
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentTab('browse')}
                    className="text-xs font-bold text-[#FF640A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    See All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {koreanSeries.slice(0, 6).map((anime) => (
                    <AnimeCard
                      key={`korean-${anime.id}`}
                      anime={anime}
                      watchlist={watchlist}
                      onSelectAnime={(a) => setSelectedAnime(a)}
                      onPlayEpisode={handlePlayEpisode}
                      onToggleWatchlist={handleToggleWatchlist}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Special Row: Blockbuster Cinema & Movies */}
            {blockbusterMovies.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                      🎬 Blockbuster Movies • Full Films
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-black uppercase">
                      Cinema Movies
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentTab('browse')}
                    className="text-xs font-bold text-[#FF640A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    See All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {blockbusterMovies.slice(0, 6).map((anime) => (
                    <AnimeCard
                      key={`movies-${anime.id}`}
                      anime={anime}
                      watchlist={watchlist}
                      onSelectAnime={(a) => setSelectedAnime(a)}
                      onPlayEpisode={handlePlayEpisode}
                      onToggleWatchlist={handleToggleWatchlist}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Row 1: Most Popular */}
            <section className="max-w-7xl mx-auto px-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  Most Popular
                </h2>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="text-xs font-bold text-[#FF640A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {popularShows.slice(0, 6).map((anime) => (
                  <AnimeCard
                    key={`popular-${anime.id}`}
                    anime={anime}
                    watchlist={watchlist}
                    onSelectAnime={(a) => setSelectedAnime(a)}
                    onPlayEpisode={handlePlayEpisode}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            </section>

            {/* Special Row: Hindi Dubbed Collection */}
            <section className="max-w-7xl mx-auto px-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                    हिंदी डब एनिमे • Hindi Dubbed Series
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                    Hindi Audio
                  </span>
                </div>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="text-xs font-bold text-[#FF640A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {hindiDubbedShows.slice(0, 6).map((anime) => (
                  <AnimeCard
                    key={`hindi-${anime.id}`}
                    anime={anime}
                    watchlist={watchlist}
                    onSelectAnime={(a) => setSelectedAnime(a)}
                    onPlayEpisode={handlePlayEpisode}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            </section>

            {/* Row 2: New Anime from Current Season */}
            <section className="max-w-7xl mx-auto px-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  New Anime from the Current Season
                </h2>
                <button
                  onClick={() => setCurrentTab('simulcasts')}
                  className="text-xs font-bold text-[#FF640A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {newSeasonShows.slice(0, 6).map((anime) => (
                  <AnimeCard
                    key={`newseason-${anime.id}`}
                    anime={anime}
                    watchlist={watchlist}
                    onSelectAnime={(a) => setSelectedAnime(a)}
                    onPlayEpisode={handlePlayEpisode}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            </section>

            {/* Row 3: Top Picks for You */}
            <section className="max-w-7xl mx-auto px-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  Top Picks for You
                </h2>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="text-xs font-bold text-[#FF640A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {topPicks.slice(0, 6).map((anime) => (
                  <AnimeCard
                    key={`toppicks-${anime.id}`}
                    anime={anime}
                    watchlist={watchlist}
                    onSelectAnime={(a) => setSelectedAnime(a)}
                    onPlayEpisode={handlePlayEpisode}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            </section>

            {/* Row 4: Get Your Rom-Com Fix */}
            <section className="max-w-7xl mx-auto px-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  Get Your Rom-Com Fix
                </h2>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="text-xs font-bold text-[#FF640A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {romComFix.slice(0, 6).map((anime) => (
                  <AnimeCard
                    key={`romcom-${anime.id}`}
                    anime={anime}
                    watchlist={watchlist}
                    onSelectAnime={(a) => setSelectedAnime(a)}
                    onPlayEpisode={handlePlayEpisode}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            </section>

            {/* Row 5: Welcome! We Have White-Haired Characters! */}
            <section className="max-w-7xl mx-auto px-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  Welcome! We Have White-Haired Characters!
                </h2>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="text-xs font-bold text-[#FF640A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {whiteHaired.slice(0, 6).map((anime) => (
                  <AnimeCard
                    key={`whitehaired-${anime.id}`}
                    anime={anime}
                    watchlist={watchlist}
                    onSelectAnime={(a) => setSelectedAnime(a)}
                    onPlayEpisode={handlePlayEpisode}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            </section>

            {/* Row 6: Soccer Legends */}
            <section className="max-w-7xl mx-auto px-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  Soccer Legends
                </h2>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="text-xs font-bold text-[#FF640A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  See All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {soccerLegends.slice(0, 6).map((anime) => (
                  <AnimeCard
                    key={`soccer-${anime.id}`}
                    anime={anime}
                    watchlist={watchlist}
                    onSelectAnime={(a) => setSelectedAnime(a)}
                    onPlayEpisode={handlePlayEpisode}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            </section>

          </div>
        )}

        {/* TAB 2: MY LISTS VIEW */}
        {currentTab === 'lists' && (
          <WatchlistPage
            animeList={animeList}
            watchlist={watchlist}
            watchProgress={watchProgress}
            onSelectAnime={(a) => setSelectedAnime(a)}
            onPlayEpisode={handlePlayEpisode}
            onToggleWatchlist={handleToggleWatchlist}
            setCurrentTab={setCurrentTab}
          />
        )}

        {/* TAB 3: BROWSE CATALOG VIEW */}
        {currentTab === 'browse' && (
          <BrowseCatalog
            animeList={animeList}
            watchlist={watchlist}
            onSelectAnime={(a) => setSelectedAnime(a)}
            onPlayEpisode={handlePlayEpisode}
            onToggleWatchlist={handleToggleWatchlist}
            setCurrentTab={setCurrentTab}
          />
        )}

        {/* TAB 4: SIMULCASTS VIEW */}
        {currentTab === 'simulcasts' && (
          <SimulcastsPage
            animeList={animeList}
            watchlist={watchlist}
            onSelectAnime={(a) => setSelectedAnime(a)}
            onPlayEpisode={handlePlayEpisode}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* TAB 5: ACCOUNT VIEW */}
        {currentTab === 'account' && (
          <AccountPage
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onOpenUploader={() => setShowUploaderModal(true)}
            setCurrentTab={setCurrentTab}
            onOpenDeployModal={() => setShowDeployModal(true)}
          />
        )}

      </main>

      {/* Detail Overlay Modal */}
      <AnimeDetailModal
        anime={selectedAnime}
        episodes={episodes}
        watchlist={watchlist}
        onClose={() => setSelectedAnime(null)}
        onPlayEpisode={handlePlayEpisode}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* Auth Modal (Log In / Create Account) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccessLogin={(email) => {
          setUserEmail(email);
          setIsLoggedIn(true);
        }}
      />

      {/* Creator Uploader Modal */}
      <UploaderModal
        isOpen={showUploaderModal}
        onClose={() => setShowUploaderModal(false)}
        animeList={animeList}
        onAddAnime={handleAddAnimeSeries}
        onAddEpisode={handleAddEpisode}
      />

      {/* Render 1-Click Deployment Modal */}
      <RenderDeployModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">Crunchyroll</span>
            <span>• Stream thousands of anime in HD</span>
          </div>
          <p>© Crunchyroll, LLC. All Rights Reserved.</p>
        </div>
      </footer>

    </div>
  );
}
