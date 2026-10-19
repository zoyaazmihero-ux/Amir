import React, { useState } from 'react';
import { 
  Upload, 
  Plus, 
  Film, 
  Video, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Trash2, 
  Play, 
  Clock, 
  Layers, 
  Star, 
  FileText, 
  FolderPlus,
  Tv,
  RefreshCw,
  Volume2,
  Subtitles,
  CheckCircle2
} from 'lucide-react';
import { Anime, Episode, AnimeGenre, AnimeStatus, AnimeType, MediaAudioTrack, MediaSubtitleTrack } from '../types';
import { storeUploadedVideoFile, saveAnimeList, saveEpisodes } from '../lib/storage';
import { extractMediaTracks, ExtractedMediaInfo } from '../lib/mediaExtractor';

interface UploaderStudioProps {
  animeList: Anime[];
  episodes: Episode[];
  onAnimeCreated: (newAnimeList: Anime[]) => void;
  onEpisodeCreated: (newEpisodes: Episode[]) => void;
}

export const UploaderStudio: React.FC<UploaderStudioProps> = ({
  animeList,
  episodes,
  onAnimeCreated,
  onEpisodeCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'upload_ep' | 'create_anime' | 'manage'>('upload_ep');

  // --- TAB 1: Upload Episode Form State ---
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>(animeList[0]?.id || '');
  const [epNumber, setEpNumber] = useState<number>(1);
  const [epTitle, setEpTitle] = useState('');
  const [epSynopsis, setEpSynopsis] = useState('');
  const [videoSourceType, setVideoSourceType] = useState<'file' | 'url'>('url');
  const [videoUrlInput, setVideoUrlInput] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [thumbnailInput, setThumbnailInput] = useState('');
  const [durationInput, setDurationInput] = useState<number>(720);
  const [introStart, setIntroStart] = useState<number>(0);
  const [introEnd, setIntroEnd] = useState<number>(90);
  const [outroStart, setOutroStart] = useState<number>(680);
  const [outroEnd, setOutroEnd] = useState<number>(720);
  const [isSubbed, setIsSubbed] = useState(true);
  const [isDubbed, setIsDubbed] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // Audio & Subtitle Extraction State for Episode URL
  const [isExtractingTracks, setIsExtractingTracks] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedMediaInfo | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');

  // --- TAB 2: Create Anime Series Form State ---
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesJpTitle, setSeriesJpTitle] = useState('');
  const [seriesSynopsis, setSeriesSynopsis] = useState('');
  const [seriesCover, setSeriesCover] = useState('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80');
  const [seriesBanner, setSeriesBanner] = useState('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80');
  const [selectedGenres, setSelectedGenres] = useState<AnimeGenre[]>(['Action', 'Sci-Fi']);
  const [seriesStudio, setSeriesStudio] = useState('Aniverse Studios');
  const [seriesRating, setSeriesRating] = useState<number>(4.8);
  const [seriesStatus, setSeriesStatus] = useState<AnimeStatus>('Ongoing');
  const [seriesType, setSeriesType] = useState<AnimeType>('TV Series');
  const [releaseYear, setReleaseYear] = useState<number>(2026);

  const availableGenres: AnimeGenre[] = [
    'Action', 'Adventure', 'Cyberpunk', 'Fantasy', 'Isekai', 
    'Mecha', 'Mystery', 'Romance', 'Sci-Fi', 'Shonen', 
    'Slice of Life', 'Supernatural', 'Thriller'
  ];

  // Auto increment episode number when anime is selected
  const handleAnimeSelectChange = (animeId: string) => {
    setSelectedAnimeId(animeId);
    const existingEps = episodes.filter(e => e.animeId === animeId);
    if (existingEps.length > 0) {
      const maxEp = Math.max(...existingEps.map(e => e.episodeNumber));
      setEpNumber(maxEp + 1);
    } else {
      setEpNumber(1);
    }
  };

  // Auto extract media tracks from URL
  const handleExtractUrlTracks = async () => {
    if (!videoUrlInput.trim()) return;
    setIsExtractingTracks(true);
    try {
      const info = await extractMediaTracks(videoUrlInput.trim());
      setExtractedInfo(info);
      if (info.audioTracks.length > 0) {
        setSelectedAudioId(info.audioTracks[0].id);
        setIsDubbed(info.audioTracks.length > 1);
      }
      if (info.subtitleTracks.length > 0) {
        setSelectedSubId(info.subtitleTracks[0].id);
        setIsSubbed(true);
      }
      if (info.duration) {
        setDurationInput(Math.round(info.duration));
      }
    } catch (err: any) {
      alert('Could not extract media info: ' + err?.message);
    } finally {
      setIsExtractingTracks(false);
    }
  };

  // Submit Episode Upload
  const handleUploadEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimeId) return;
    setIsUploading(true);
    setUploadSuccessMsg('');

    try {
      let finalVideoUrl = videoUrlInput.trim();

      // Store local video file in IndexedDB if user picked a file
      if (videoSourceType === 'file' && uploadedVideoFile) {
        const fileId = `ep_video_${Date.now()}_${uploadedVideoFile.name}`;
        finalVideoUrl = await storeUploadedVideoFile(fileId, uploadedVideoFile);
      }

      if (!finalVideoUrl) {
        alert('Please provide a valid video file or stream URL');
        setIsUploading(false);
        return;
      }

      const targetAnime = animeList.find(a => a.id === selectedAnimeId);

      const newEp: Episode = {
        id: 'ep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        animeId: selectedAnimeId,
        episodeNumber: epNumber,
        title: epTitle.trim() || `Episode ${epNumber}`,
        synopsis: epSynopsis.trim(),
        videoUrl: finalVideoUrl,
        thumbnailUrl: thumbnailInput.trim() || targetAnime?.coverImage || '',
        duration: durationInput,
        introStart,
        introEnd,
        outroStart,
        outroEnd,
        isSubbed,
        isDubbed,
        uploadedAt: new Date().toISOString(),
        viewsCount: 0,
        quality: extractedInfo?.video?.resolution || '1080p',
        language: extractedInfo?.audioTracks.find(a => a.id === selectedAudioId)?.label || (isDubbed ? 'Dual Audio' : 'Japanese'),
        audioTracks: extractedInfo?.audioTracks || [],
        subtitleTracks: extractedInfo?.subtitleTracks || [],
      };

      const updatedEpisodes = [newEp, ...episodes];
      saveEpisodes(updatedEpisodes);
      onEpisodeCreated(updatedEpisodes);

      // Update total episodes count in anime list
      if (targetAnime) {
        const updatedAnimeList = animeList.map(a => 
          a.id === targetAnime.id 
            ? { ...a, totalEpisodes: Math.max(a.totalEpisodes, epNumber) } 
            : a
        );
        saveAnimeList(updatedAnimeList);
        onAnimeCreated(updatedAnimeList);
      }

      setUploadSuccessMsg(`🎉 Episode ${epNumber} uploaded successfully!`);
      setEpTitle('');
      setEpSynopsis('');
      setEpNumber(epNumber + 1);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + err);
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Create New Anime Series
  const handleCreateAnimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesTitle.trim()) return;

    const newAnime: Anime = {
      id: 'anime-' + Date.now(),
      title: seriesTitle.trim(),
      japaneseTitle: seriesJpTitle.trim(),
      synopsis: seriesSynopsis.trim() || 'A brand new anime series.',
      coverImage: seriesCover.trim(),
      bannerImage: seriesBanner.trim() || seriesCover.trim(),
      genres: selectedGenres,
      releaseYear,
      status: seriesStatus,
      type: seriesType,
      studio: seriesStudio.trim() || 'Indie Studio',
      rating: seriesRating,
      totalEpisodes: 0,
      isTrending: false,
      isFeatured: false,
      views: 0
    };

    const updatedList = [newAnime, ...animeList];
    saveAnimeList(updatedList);
    onAnimeCreated(updatedList);

    setSelectedAnimeId(newAnime.id);
    setActiveTab('upload_ep');
    setSeriesTitle('');
    setSeriesJpTitle('');
    setSeriesSynopsis('');
    alert(`Series "${newAnime.title}" created! You can now upload Episode 1.`);
  };

  // Delete Episode
  const handleDeleteEpisode = (epId: string) => {
    if (confirm('Are you sure you want to delete this episode?')) {
      const updated = episodes.filter(e => e.id !== epId);
      saveEpisodes(updated);
      onEpisodeCreated(updated);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">
              Aniverse Uploader Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Publish new anime series, upload MP4 episodes, set auto skip intro/outro timers, and manage video content.
          </p>
        </div>

        {/* Tab Navigation Switches */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('upload_ep')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'upload_ep'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Upload Episode
          </button>

          <button
            onClick={() => setActiveTab('create_anime')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'create_anime'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Series
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'manage'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Manage Content
          </button>
        </div>
      </div>

      {/* --- TAB 1: UPLOAD EPISODE FORM --- */}
      {activeTab === 'upload_ep' && (
        <form onSubmit={handleUploadEpisodeSubmit} className="mt-8 space-y-6">
          
          {uploadSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              {uploadSuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Box: Anime Target & Ep Meta */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" />
                Select Target Anime & Details
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Series</label>
                <select
                  value={selectedAnimeId}
                  onChange={(e) => handleAnimeSelectChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {animeList.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.totalEpisodes} Ep)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ep #</label>
                  <input
                    type="number"
                    min="1"
                    value={epNumber}
                    onChange={(e) => setEpNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Episode Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Awakening of the Blade"
                    value={epTitle}
                    onChange={(e) => setEpTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Episode Synopsis / Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of episode events..."
                  value={epSynopsis}
                  onChange={(e) => setEpSynopsis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thumbnail Poster URL</label>
                <input
                  type="text"
                  placeholder="https://... image poster link"
                  value={thumbnailInput}
                  onChange={(e) => setThumbnailInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Right Box: Video Source & Skip Timers */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-400" />
                Video Media & Skip Intro Config
              </h2>

              {/* Source Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Video Upload Source</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('url')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      videoSourceType === 'url'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Direct Video Stream URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('file')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      videoSourceType === 'file'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Upload MP4 File from Computer
                  </button>
                </div>
              </div>

              {videoSourceType === 'url' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Direct Video URL (.mkv / .mp4)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder="https://... video file .mkv or .mp4"
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleExtractUrlTracks}
                        disabled={isExtractingTracks || !videoUrlInput.trim()}
                        className="px-3.5 py-2 bg-[#FF640A] hover:bg-[#e05300] disabled:opacity-50 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                        title="Extract all audio tracks & subtitles from this URL"
                      >
                        {isExtractingTracks ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 fill-black" />
                        )}
                        <span>Extract Tracks</span>
                      </button>
                    </div>
                  </div>

                  {/* EXTRACTED TRACKS DISPLAY CARD */}
                  {extractedInfo && (
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Tracks Extracted Successfully!
                        </span>
                        {extractedInfo.video?.resolution && (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-[#FF640A] font-bold">
                            {extractedInfo.video.resolution}
                          </span>
                        )}
                      </div>

                      {/* Audio Tracks */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-[#FF640A]" />
                          Audio Tracks ({extractedInfo.audioTracks.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {extractedInfo.audioTracks.map((a) => (
                            <button
                              type="button"
                              key={a.id}
                              onClick={() => setSelectedAudioId(a.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                                selectedAudioId === a.id
                                  ? 'bg-[#FF640A] text-black font-bold'
                                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <span>{a.label}</span>
                              {a.codec && <span className="opacity-70 text-[9px]">({a.codec})</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Subtitle Tracks */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                          <Subtitles className="w-3 h-3 text-[#FF640A]" />
                          Subtitle Tracks ({extractedInfo.subtitleTracks.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {extractedInfo.subtitleTracks.map((s) => (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => setSelectedSubId(s.id)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${
                                selectedSubId === s.id
                                  ? 'bg-amber-400 text-black font-bold'
                                  : 'bg-slate-900 text-slate-300 border border-slate-800'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Choose Video File (.mp4, .webm)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedVideoFile(e.target.files[0]);
                      }
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-semibold"
                  />
                  {uploadedVideoFile && (
                    <p className="text-[11px] text-emerald-400 font-mono mt-1">
                      File selected: {uploadedVideoFile.name} ({(uploadedVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </p>
                  )}
                </div>
              )}

              {/* Skip Intro/Outro Timers */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Intro Start (Sec)</label>
                  <input
                    type="number"
                    value={introStart}
                    onChange={(e) => setIntroStart(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Intro End (Sec)</label>
                  <input
                    type="number"
                    value={introEnd}
                    onChange={(e) => setIntroEnd(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Sub / Dub Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={isSubbed}
                    onChange={(e) => setIsSubbed(e.target.checked)}
                    className="rounded accent-indigo-600"
                  />
                  Has Japanese Subtitles (SUB)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={isDubbed}
                    onChange={(e) => setIsDubbed(e.target.checked)}
                    className="rounded accent-purple-600"
                  />
                  Has Audio Dubbing (DUB)
                </label>
              </div>

            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {isUploading ? 'Publishing Episode...' : `Publish Episode ${epNumber}`}
          </button>
        </form>
      )}

      {/* --- TAB 2: CREATE NEW ANIME SERIES --- */}
      {activeTab === 'create_anime' && (
        <form onSubmit={handleCreateAnimeSubmit} className="mt-8 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              Anime Series Profile & Artwork
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Anime Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solo Hunter Season 2"
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Japanese Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ソロハンター"
                  value={seriesJpTitle}
                  onChange={(e) => setSeriesJpTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Synopsis</label>
              <textarea
                rows={3}
                placeholder="Full anime storyline overview..."
                value={seriesSynopsis}
                onChange={(e) => setSeriesSynopsis(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cover Poster Image URL</label>
                <input
                  type="text"
                  value={seriesCover}
                  onChange={(e) => setSeriesCover(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Backdrop Image URL</label>
                <input
                  type="text"
                  value={seriesBanner}
                  onChange={(e) => setSeriesBanner(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Genres</label>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map((g) => {
                  const isSel = selectedGenres.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          setSelectedGenres(selectedGenres.filter(x => x !== g));
                        } else {
                          setSelectedGenres([...selectedGenres, g]);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isSel
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Studio</label>
                <input
                  type="text"
                  value={seriesStudio}
                  onChange={(e) => setSeriesStudio(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Rating</label>
                <input
                  type="number"
                  step="0.1"
                  max="5"
                  value={seriesRating}
                  onChange={(e) => setSeriesRating(parseFloat(e.target.value) || 4.5)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
                <select
                  value={seriesStatus}
                  onChange={(e) => setSeriesStatus(e.target.value as AnimeStatus)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Type</label>
                <select
                  value={seriesType}
                  onChange={(e) => setSeriesType(e.target.value as AnimeType)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="TV Series">TV Series</option>
                  <option value="Movie">Movie</option>
                  <option value="OVA">OVA</option>
                </select>
              </div>
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Anime Series
          </button>
        </form>
      )}

      {/* --- TAB 3: MANAGE CONTENT --- */}
      {activeTab === 'manage' && (
        <div className="mt-8 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Uploaded Anime Catalog ({animeList.length})
            </h2>

            <div className="divide-y divide-slate-800">
              {animeList.map((anime) => {
                const animeEps = episodes.filter(e => e.animeId === anime.id);
                return (
                  <div key={anime.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={anime.coverImage} alt={anime.title} className="w-12 h-16 object-cover rounded-lg" />
                      <div>
                        <h3 className="text-sm font-bold text-white">{anime.title}</h3>
                        <p className="text-xs text-slate-400">{anime.studio} • {anime.genres.join(', ')}</p>
                        <span className="text-[11px] text-indigo-400 font-semibold">{animeEps.length} Episodes Published</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {animeEps.map((ep) => (
                        <div key={ep.id} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                          <span>Ep {ep.episodeNumber}: {ep.title}</span>
                          <button
                            onClick={() => handleDeleteEpisode(ep.id)}
                            className="text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
