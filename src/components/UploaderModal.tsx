import React, { useState } from 'react';
import { X, Upload, Film, Check, Sparkles, Volume2, Subtitles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Anime, Episode, AnimeGenre, MediaAudioTrack, MediaSubtitleTrack } from '../types';
import { extractMediaTracks, ExtractedMediaInfo } from '../lib/mediaExtractor';

interface UploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeList: Anime[];
  onAddAnime: (newAnime: Anime) => void;
  onAddEpisode: (newEpisode: Episode) => void;
}

export const UploaderModal: React.FC<UploaderModalProps> = ({
  isOpen,
  onClose,
  animeList,
  onAddAnime,
  onAddEpisode,
}) => {
  const [activeMode, setActiveMode] = useState<'episode' | 'anime'>('episode');
  
  // Anime Form state
  const [animeTitle, setAnimeTitle] = useState('');
  const [animeSynopsis, setAnimeSynopsis] = useState('');
  const [animeCover, setAnimeCover] = useState('');
  const [animeBanner, setAnimeBanner] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<AnimeGenre[]>(['Action', 'Shonen']);

  // Episode Form state
  const [targetAnimeId, setTargetAnimeId] = useState(animeList[0]?.id || '');
  const [epNumber, setEpNumber] = useState(1);
  const [epTitle, setEpTitle] = useState('');
  const [epSynopsis, setEpSynopsis] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isExtractingTracks, setIsExtractingTracks] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedMediaInfo | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');

  const handleExtractModalTracks = async () => {
    if (!videoUrlInput.trim()) return;
    setIsExtractingTracks(true);
    try {
      const info = await extractMediaTracks(videoUrlInput.trim());
      setExtractedInfo(info);
      if (info.audioTracks.length > 0) setSelectedAudioId(info.audioTracks[0].id);
      if (info.subtitleTracks.length > 0) setSelectedSubId(info.subtitleTracks[0].id);
    } catch (err: any) {
      alert('Could not extract media info: ' + err?.message);
    } finally {
      setIsExtractingTracks(false);
    }
  };

  if (!isOpen) return null;

  const handleCreateAnime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!animeTitle.trim()) return;

    const newA: Anime = {
      id: `anime-${Date.now()}`,
      title: animeTitle.trim(),
      synopsis: animeSynopsis.trim() || 'No synopsis provided.',
      coverImage: animeCover.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      bannerImage: animeBanner.trim() || animeCover.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80',
      genres: selectedGenres,
      releaseYear: 2026,
      status: 'Ongoing',
      type: 'TV Series',
      studio: 'Creator Studio',
      rating: 5.0,
      totalEpisodes: 1,
      views: 100,
    };

    onAddAnime(newA);
    setAnimeTitle('');
    setAnimeSynopsis('');
    setAnimeCover('');
    setAnimeBanner('');
    alert('Anime series added successfully!');
    setActiveMode('episode');
    setTargetAnimeId(newA.id);
  };

  const handleCreateEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAnimeId || !epTitle.trim()) return;

    let finalVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
    if (videoFile) {
      finalVideoUrl = URL.createObjectURL(videoFile);
    } else if (videoUrlInput.trim()) {
      finalVideoUrl = videoUrlInput.trim();
    }

    const newEp: Episode = {
      id: `ep-${Date.now()}`,
      animeId: targetAnimeId,
      episodeNumber: epNumber,
      title: epTitle.trim(),
      synopsis: epSynopsis.trim(),
      videoUrl: finalVideoUrl,
      thumbnailUrl: animeList.find(a => a.id === targetAnimeId)?.coverImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      duration: 1440,
      introStart: 0,
      introEnd: 90,
      outroStart: 1350,
      outroEnd: 1440,
      isSubbed: (extractedInfo?.subtitleTracks.length || 0) > 0,
      isDubbed: (extractedInfo?.audioTracks.length || 0) > 1,
      uploadedAt: new Date().toISOString(),
      viewsCount: 1,
      quality: extractedInfo?.video?.resolution || '1080p',
      language: extractedInfo?.audioTracks.find(a => a.id === selectedAudioId)?.label || 'Dual Audio',
      audioTracks: extractedInfo?.audioTracks || [],
      subtitleTracks: extractedInfo?.subtitleTracks || [],
    };

    onAddEpisode(newEp);
    setEpTitle('');
    setEpSynopsis('');
    setVideoFile(null);
    setVideoUrlInput('');
    alert('Episode uploaded successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#FF640A]" />
            Creator Uploader Studio
          </h2>
          <p className="text-xs text-zinc-400">Upload video files or create new anime series.</p>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveMode('episode')}
            className={`flex-1 py-2 rounded text-xs font-bold transition-colors cursor-pointer ${
              activeMode === 'episode' ? 'bg-[#FF640A] text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Upload Episode
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('anime')}
            className={`flex-1 py-2 rounded text-xs font-bold transition-colors cursor-pointer ${
              activeMode === 'anime' ? 'bg-[#FF640A] text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Add New Anime Series
          </button>
        </div>

        {/* FORM 1: Upload Episode */}
        {activeMode === 'episode' && (
          <form onSubmit={handleCreateEpisode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Select Anime Series</label>
              <select
                value={targetAnimeId}
                onChange={(e) => setTargetAnimeId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-[#FF640A]"
              >
                {animeList.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Ep Number</label>
                <input
                  type="number"
                  min={1}
                  value={epNumber}
                  onChange={(e) => setEpNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-300 mb-1">Episode Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Awakening of the Shinobi"
                  value={epTitle}
                  onChange={(e) => setEpTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Video File Upload (.mp4, .webm)</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#FF640A] file:text-black hover:file:bg-[#e05300]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Direct Video URL (.mkv, .mp4)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://... video file .mkv or .mp4"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleExtractModalTracks}
                  disabled={isExtractingTracks || !videoUrlInput.trim()}
                  className="px-3 py-2 bg-[#FF640A] hover:bg-[#e05300] disabled:opacity-50 text-black font-extrabold text-xs rounded flex items-center gap-1 cursor-pointer shrink-0"
                  title="Extract all audio tracks & subtitles from URL"
                >
                  {isExtractingTracks ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 fill-black" />}
                  <span>Extract</span>
                </button>
              </div>

              {extractedInfo && (
                <div className="mt-2 p-2.5 bg-black/60 border border-zinc-800 rounded space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Extracted {extractedInfo.audioTracks.length} Audio & {extractedInfo.subtitleTracks.length} Subs
                    </span>
                  </div>

                  {/* Audio */}
                  <div className="flex flex-wrap gap-1">
                    {extractedInfo.audioTracks.map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => setSelectedAudioId(a.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          selectedAudioId === a.id ? 'bg-[#FF640A] text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>

                  {/* Subs */}
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {extractedInfo.subtitleTracks.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setSelectedSubId(s.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          selectedSubId === s.id ? 'bg-amber-400 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#FF640A] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#e05300] cursor-pointer"
            >
              UPLOAD EPISODE
            </button>
          </form>
        )}

        {/* FORM 2: Add New Anime */}
        {activeMode === 'anime' && (
          <form onSubmit={handleCreateAnime} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Anime Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Solo Leveling Season 2"
                value={animeTitle}
                onChange={(e) => setAnimeTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Synopsis</label>
              <textarea
                rows={3}
                placeholder="Enter series synopsis..."
                value={animeSynopsis}
                onChange={(e) => setAnimeSynopsis(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Poster Cover Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={animeCover}
                onChange={(e) => setAnimeCover(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#FF640A] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#e05300] cursor-pointer"
            >
              CREATE ANIME SERIES
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
