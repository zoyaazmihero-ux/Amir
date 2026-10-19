import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  SkipForward, 
  Settings, 
  MessageSquare, 
  ThumbsUp, 
  Send, 
  Clock, 
  ArrowLeft,
  Sparkles,
  Subtitles,
  Tv,
  Download,
  ExternalLink,
  Copy,
  Check,
  Radio,
  FileText,
  RefreshCw,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Anime, Episode, Comment, MediaAudioTrack, MediaSubtitleTrack } from '../types';
import { getComments, addComment, toggleCommentLike, saveWatchProgress, getWatchProgress } from '../lib/storage';
import { extractMediaTracks, ExtractedMediaInfo } from '../lib/mediaExtractor';

interface WatchViewProps {
  anime: Anime;
  episodes: Episode[];
  initialEpisodeNumber?: number;
  onBack: () => void;
  onSelectNextEpisode?: (epNum: number) => void;
}

export const WatchView: React.FC<WatchViewProps> = ({
  anime,
  episodes,
  initialEpisodeNumber = 1,
  onBack,
}) => {
  const sortedEpisodes = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
  const [currentEpisodeNumber, setCurrentEpisodeNumber] = useState<number>(initialEpisodeNumber);

  const currentEpisode = sortedEpisodes.find(e => e.episodeNumber === currentEpisodeNumber) || sortedEpisodes[0];

  // Active Video URL (supports custom URL or episode URL)
  const [customPlayingUrl, setCustomPlayingUrl] = useState<string | null>(null);
  const activeVideoUrl = customPlayingUrl || currentEpisode?.videoUrl || '';

  // Video & Audio Element Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Dynamic Audio & Subtitle Extraction State ---
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedMediaInfo | null>(null);
  const [audioTracks, setAudioTracks] = useState<MediaAudioTrack[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<MediaSubtitleTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<MediaAudioTrack | null>(null);
  const [selectedSubTrack, setSelectedSubTrack] = useState<MediaSubtitleTrack | null>(null);
  const [trackFeedback, setTrackFeedback] = useState<{ text: string; type: 'audio' | 'sub' } | null>(null);
  const [subtitleColor, setSubtitleColor] = useState<'yellow' | 'white'>('yellow');
  const [subtitleFontSize, setSubtitleFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [showUrlInspector, setShowUrlInspector] = useState(true);

  // Browser-compatible live stream URL (routes MKV / bot-hosting through live stream engine)
  const liveStreamUrl = activeVideoUrl
    ? (activeVideoUrl.endsWith('.mkv') || activeVideoUrl.includes('.mkv?') || activeVideoUrl.includes('bot-hosting.cloud'))
      ? `/api/media/stream?url=${encodeURIComponent(activeVideoUrl)}&audioIndex=${selectedAudioTrack?.index || 1}`
      : activeVideoUrl
    : '';

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const [autoNext, setAutoNext] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasMediaError, setHasMediaError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // --- Real Subtitle Cues & Playback Sync ---
  const [subtitleCues, setSubtitleCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const [activeSubtitleText, setActiveSubtitleText] = useState<string>('');
  const [isLoadingSubtitles, setIsLoadingSubtitles] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<'comments' | 'transcript'>('transcript');

  // --- Download Center Modal ---
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Custom URL Input Box
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isExtractingCustomUrl, setIsExtractingCustomUrl] = useState(false);

  // Timeline hover
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const progressContainerRef = useRef<HTMLDivElement>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [userName, setUserName] = useState('');

  // Parse WebVTT content into timed cues for real video subtitle rendering
  const parseVttCues = (vttText: string): { start: number; end: number; text: string }[] => {
    const lines = vttText.split(/\r?\n/);
    const cues: { start: number; end: number; text: string }[] = [];
    let currentStart: number | null = null;
    let currentEnd: number | null = null;
    let currentText: string[] = [];

    const parseSeconds = (timeStr: string): number => {
      const parts = timeStr.trim().split(':');
      if (parts.length === 3) {
        const [h, m, s] = parts;
        return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
      } else if (parts.length === 2) {
        const [m, s] = parts;
        return parseFloat(m) * 60 + parseFloat(s);
      }
      return parseFloat(timeStr) || 0;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('-->')) {
        if (currentStart !== null && currentEnd !== null && currentText.length > 0) {
          cues.push({ start: currentStart, end: currentEnd, text: currentText.join('\n') });
          currentText = [];
        }
        const [sStr, eStr] = line.split('-->');
        currentStart = parseSeconds(sStr.split(' ')[0]);
        currentEnd = parseSeconds(eStr.trim().split(' ')[0]);
      } else if (
        currentStart !== null &&
        line.length > 0 &&
        !line.startsWith('WEBVTT') &&
        !line.startsWith('Kind:') &&
        !line.startsWith('Language:')
      ) {
        currentText.push(line.replace(/<[^>]+>/g, ''));
      } else if (line === '' && currentStart !== null && currentEnd !== null) {
        if (currentText.length > 0) {
          cues.push({ start: currentStart, end: currentEnd, text: currentText.join('\n') });
          currentText = [];
        }
        currentStart = null;
        currentEnd = null;
      }
    }
    if (currentStart !== null && currentEnd !== null && currentText.length > 0) {
      cues.push({ start: currentStart, end: currentEnd, text: currentText.join('\n') });
    }
    return cues;
  };

  // Fetch real WebVTT subtitle track and load cues whenever track changes
  useEffect(() => {
    if (!activeVideoUrl || !selectedSubTrack) {
      setSubtitleCues([]);
      setActiveSubtitleText('');
      return;
    }

    let isMounted = true;
    setIsLoadingSubtitles(true);

    const subUrl = `/api/media/subtitles?url=${encodeURIComponent(activeVideoUrl)}&subIndex=${selectedSubTrack.index}&lang=${selectedSubTrack.language}`;
    fetch(subUrl)
      .then((res) => res.text())
      .then((text) => {
        if (!isMounted) return;
        const parsed = parseVttCues(text);
        setSubtitleCues(parsed);
      })
      .catch((err) => {
        console.warn('Could not fetch subtitles from server:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSubtitles(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeVideoUrl, selectedSubTrack]);

  // Extract Audio & Subtitle tracks from the active video URL
  useEffect(() => {
    if (!activeVideoUrl) return;

    let isMounted = true;
    setIsExtracting(true);

    extractMediaTracks(activeVideoUrl)
      .then((info) => {
        if (!isMounted) return;
        setExtractedInfo(info);
        setAudioTracks(info.audioTracks || []);
        setSubtitleTracks(info.subtitleTracks || []);

        // Auto select default audio track
        const defaultAudio = info.audioTracks.find(a => a.isDefault) || info.audioTracks[0] || null;
        setSelectedAudioTrack(defaultAudio);

        // Auto select default subtitle track
        const defaultSub = info.subtitleTracks.find(s => s.isDefault) || info.subtitleTracks[0] || null;
        setSelectedSubTrack(defaultSub);

        if (info.duration && !duration) {
          setDuration(info.duration);
        }
      })
      .catch((err) => {
        console.error('Extraction error:', err);
      })
      .finally(() => {
        if (isMounted) setIsExtracting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeVideoUrl]);

  // Load saved watch progress if available
  useEffect(() => {
    if (currentEpisode) {
      const savedList = getWatchProgress();
      const saved = savedList.find(p => p.episodeId === currentEpisode.id);
      if (saved && saved.progressSeconds > 5 && saved.progressSeconds < saved.durationSeconds - 10) {
        if (videoRef.current) {
          videoRef.current.currentTime = saved.progressSeconds;
        }
      }
      setComments(getComments(currentEpisode.id));
      setHasMediaError(false);
      setCustomPlayingUrl(null);
    }
  }, [currentEpisode]);

  // Handle Play / Pause (synced video and audio)
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          if (audioRef.current && selectedAudioTrack && selectedAudioTrack.index === 2) {
            audioRef.current.currentTime = videoRef.current!.currentTime;
            audioRef.current.play().catch(() => {});
          }
        }).catch(() => {
          // If browser restricts autoplay
          setIsPlaying(false);
        });
      }
    }
  };

  const handleSeekOffset = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
      videoRef.current.currentTime = newTime;
      if (audioRef.current) audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      updateActiveSubtitle(newTime);
    }
  };

  const jumpToTime = (timeInSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      if (audioRef.current) audioRef.current.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
      updateActiveSubtitle(timeInSeconds);
      if (!isPlaying) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          if (audioRef.current && selectedAudioTrack && selectedAudioTrack.index === 2) {
            audioRef.current.currentTime = timeInSeconds;
            audioRef.current.play().catch(() => {});
          }
        }).catch(() => {});
      }
    }
  };

  const updateActiveSubtitle = (cur: number) => {
    if (subtitleCues.length > 0 && selectedSubTrack) {
      const match = subtitleCues.find(c => cur >= c.start && cur <= c.end);
      setActiveSubtitleText(match ? match.text : '');
    } else {
      setActiveSubtitleText('');
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || duration || 0;
      setCurrentTime(cur);
      if (dur > 0) setDuration(dur);

      updateActiveSubtitle(cur);

      // Keep isolated audio track synced with video
      if (audioRef.current && !audioRef.current.paused && isPlaying) {
        if (Math.abs(audioRef.current.currentTime - cur) > 0.3) {
          audioRef.current.currentTime = cur;
        }
      }

      if (cur > 0 && Math.floor(cur) % 5 === 0 && currentEpisode) {
        saveWatchProgress({
          animeId: anime.id,
          episodeId: currentEpisode.id,
          episodeNumber: currentEpisode.episodeNumber,
          progressSeconds: Math.floor(cur),
          durationSeconds: Math.floor(dur),
          lastWatchedAt: new Date().toISOString()
        });
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
    if (autoNext) {
      const nextEp = sortedEpisodes.find(e => e.episodeNumber === currentEpisodeNumber + 1);
      if (nextEp) {
        setCurrentEpisodeNumber(nextEp.episodeNumber);
      }
    }
  };

  // Audio Track Switch Handler: "uske baad woh lagane par video chale"
  const handleSelectAudioTrack = (track: MediaAudioTrack) => {
    setSelectedAudioTrack(track);
    setTrackFeedback({ text: `Audio switched to: ${track.label}`, type: 'audio' });
    setTimeout(() => setTrackFeedback(null), 3000);

    // Apply audio and resume video playback smoothly
    if (videoRef.current) {
      const savedTime = videoRef.current.currentTime;
      if (track.index === 2) {
        // English Audio track: use isolated synchronized AAC audio
        videoRef.current.muted = true;
        if (audioRef.current) {
          audioRef.current.src = `/api/media/audio?url=${encodeURIComponent(activeVideoUrl)}&audioIndex=2&lang=${track.language}`;
          audioRef.current.currentTime = savedTime;
          audioRef.current.volume = volume;
          audioRef.current.muted = isMuted;
          if (isPlaying) audioRef.current.play().catch(() => {});
        }
      } else {
        // Japanese or primary track: play through video element
        videoRef.current.muted = isMuted;
        if (audioRef.current) audioRef.current.pause();
      }
      videoRef.current.currentTime = savedTime;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  // Subtitle Track Switch Handler: "और लगाने पर वीडियो पर चले वो"
  const handleSelectSubTrack = (track: MediaSubtitleTrack | null) => {
    setSelectedSubTrack(track);
    setTrackFeedback({ 
      text: track ? `Subtitles: ${track.label}` : 'Subtitles Turned Off', 
      type: 'sub' 
    });
    setTimeout(() => setTrackFeedback(null), 3000);
  };

  // Play Custom URL with Extracted Tracks
  const handleExtractAndPlayCustomUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customUrlInput.trim()) return;

    setIsExtractingCustomUrl(true);
    try {
      const info = await extractMediaTracks(customUrlInput.trim());
      setExtractedInfo(info);
      setAudioTracks(info.audioTracks);
      setSubtitleTracks(info.subtitleTracks);
      setSelectedAudioTrack(info.audioTracks[0] || null);
      setSelectedSubTrack(info.subtitleTracks[0] || null);
      setCustomPlayingUrl(customUrlInput.trim());
      setHasMediaError(false);

      setTrackFeedback({ 
        text: `Extracted ${info.audioTracks.length} Audio Tracks & ${info.subtitleTracks.length} Subtitles! Playing now.`, 
        type: 'audio' 
      });
      setTimeout(() => setTrackFeedback(null), 4000);

      // Play in video
      if (videoRef.current) {
        videoRef.current.src = customUrlInput.trim();
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } catch (err: any) {
      alert(`Could not extract from URL: ${err?.message || 'Check URL format'}`);
    } finally {
      setIsExtractingCustomUrl(false);
    }
  };

  const formatTime = (timeSec: number) => {
    if (isNaN(timeSec)) return '00:00';
    const mins = Math.floor(timeSec / 60);
    const secs = Math.floor(timeSec % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !duration) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
    setHoverPosition(e.clientX - rect.left);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !duration) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    jumpToTime(pos * duration);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentEpisode) return;

    const newC = addComment(currentEpisode.id, userName || 'AnimeFan', commentText, formatTime(currentTime));
    setComments([newC, ...comments]);
    setCommentText('');
  };

  if (!currentEpisode) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      
      {/* Top Header with Spinning Reel Widget */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-2 text-xs font-extrabold uppercase transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF640A]" />
          Back to {anime.title}
        </button>

        {/* ROTATING REEL WIDGET: गोल-गोल घूमे जब वीडियो चले, बंद हो जब वीडियो रुके */}
        <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800/90 rounded-full px-4 py-1.5 shadow-xl">
          <div 
            onClick={togglePlay}
            className={`relative w-8 h-8 rounded-full border-2 border-dashed border-[#FF640A] flex items-center justify-center cursor-pointer transition-all ${
              isPlaying ? 'animate-[spin_2s_linear_infinite] shadow-[0_0_15px_rgba(255,100,10,0.85)] scale-105' : 'rotate-0 opacity-70'
            }`}
            title={isPlaying ? "वीडियो चल रहा है: चक्र गोल-गोल घूम रहा है (क्लिक करके रोकें)" : "वीडियो रुका हुआ है: चक्र बंद है (क्लिक करके चलाएं)"}
          >
            {/* Reel Center & Film Holes */}
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-950 border border-[#FF640A] flex items-center justify-center">
              <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#FF640A] animate-ping' : 'bg-[#FF640A]'}`} />
            </div>
            <div className="absolute w-full h-[1px] bg-[#FF640A]/40" />
            <div className="absolute h-full w-[1px] bg-[#FF640A]/40" />
          </div>

          <div className="flex flex-col cursor-pointer" onClick={togglePlay}>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                {isPlaying ? 'चक्र गोल-गोल घूम रहा है' : 'चक्र रुका हुआ है'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold">
              {isPlaying ? 'Video Playing • Reel Spinning' : 'Video Paused • Reel Stopped'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold text-[#FF640A] uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#FF640A] animate-pulse" />
            CRUNCHYROLL MULTI-AUDIO ENGINE
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Video Section (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* VIDEO FRAME */}
          <div 
            id="video-player-container"
            className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-zinc-900 group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {/* Synced Isolated Audio Track Element */}
            <audio ref={audioRef} preload="auto" className="hidden" />

            <video
              ref={videoRef}
              src={liveStreamUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onError={() => {
                // If live stream needs retry, attempt smooth playback
                if (videoRef.current && liveStreamUrl) {
                  videoRef.current.load();
                }
              }}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
            >
              {selectedSubTrack && (
                <track 
                  kind="subtitles" 
                  src={`/api/media/subtitles?url=${encodeURIComponent(activeVideoUrl)}&subIndex=${selectedSubTrack.index}&lang=${selectedSubTrack.language}`}
                  label={selectedSubTrack.label} 
                  srcLang={selectedSubTrack.language}
                  default
                />
              )}
            </video>

            {/* FLOATING TOP-RIGHT REEL DISC OVERLAY */}
            <div 
              onClick={togglePlay}
              className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-[#FF640A]/50 rounded-full px-3.5 py-1.5 shadow-2xl cursor-pointer hover:border-[#FF640A] transition-all"
              title={isPlaying ? "वीडियो चल रहा है • चक्र गोल-गोल घूम रहा है" : "वीडियो रुका हुआ है • चक्र बंद है"}
            >
              <div className={`relative w-6 h-6 rounded-full border-2 border-dashed border-[#FF640A] flex items-center justify-center ${
                isPlaying ? 'animate-[spin_1.5s_linear_infinite] shadow-[0_0_12px_rgba(255,100,10,0.8)]' : 'rotate-0 opacity-50'
              }`}>
                <div className="w-2 h-2 rounded-full bg-[#FF640A]" />
                <div className="absolute w-full h-[1px] bg-[#FF640A]/40" />
                <div className="absolute h-full w-[1px] bg-[#FF640A]/40" />
              </div>
              <span className="text-[11px] font-black uppercase text-white tracking-wider">
                {isPlaying ? 'रील्ड चालू (Spinning)' : 'रील्ड बंद (Stopped)'}
              </span>
            </div>

            {/* LIVE FEEDBACK TOAST (Audio / Subtitle Switched) */}
            {trackFeedback && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/90 border border-[#FF640A] text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
                {trackFeedback.type === 'audio' ? (
                  <Volume2 className="w-4 h-4 text-[#FF640A]" />
                ) : (
                  <Subtitles className="w-4 h-4 text-[#FF640A]" />
                )}
                <span>{trackFeedback.text}</span>
              </div>
            )}

            {/* CRUNCHYROLL-STYLE AUTHENTIC SUBTITLE DISPLAY OVERLAY */}
            {selectedSubTrack && (
              activeSubtitleText ? (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 max-w-[88%] pointer-events-none text-center">
                  <span className={`inline-block font-sans font-bold leading-relaxed px-4 py-1.5 rounded-md drop-shadow-[0_2px_8px_rgba(0,0,0,1)] border border-black/50 transition-all ${
                    subtitleFontSize === 'normal'
                      ? 'text-sm sm:text-base md:text-lg'
                      : subtitleFontSize === 'large'
                      ? 'text-base sm:text-lg md:text-xl'
                      : 'text-lg sm:text-xl md:text-2xl'
                  } ${
                    subtitleColor === 'yellow' ? 'text-[#FFE800] bg-black/85' : 'text-white bg-black/85'
                  }`}>
                    {activeSubtitleText}
                  </span>
                </div>
              ) : isLoadingSubtitles ? (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded bg-black/70 text-zinc-300 text-xs font-semibold">
                  <RefreshCw className="w-3 h-3 text-[#FF640A] animate-spin" />
                  <span>Loading real dialogue subtitles...</span>
                </div>
              ) : null
            )}

            {/* MKV / Codec Fallback Container with 1-Click Launchers */}
            {hasMediaError && (
              <div className="absolute inset-0 z-40 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#FF640A]/20 border border-[#FF640A]/40 flex items-center justify-center text-[#FF640A]">
                  <Volume2 className="w-7 h-7" />
                </div>
                <div className="max-w-lg space-y-1.5">
                  <h3 className="text-base font-black text-white uppercase tracking-wide">
                    Multi-Audio & Subtitle MKV Media Stream
                  </h3>
                  <p className="text-xs text-zinc-300">
                    This episode is packaged with <strong>{audioTracks.length} audio tracks</strong> ({audioTracks.map(a => a.label).join(' • ')}) and <strong>{subtitleTracks.length} subtitle tracks</strong>.
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    You can switch audio and subtitles below, open directly in external players (VLC, MX Player, IINA) with tracks intact, or stream directly.
                  </p>
                </div>

                {/* Track Quick Selector inside Error Frame */}
                {audioTracks.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-md pt-1">
                    <span className="text-[11px] font-bold text-zinc-400">Select Audio:</span>
                    {audioTracks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectAudioTrack(t)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          selectedAudioTrack?.id === t.id
                            ? 'bg-[#FF640A] text-black shadow-lg scale-105'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <a
                    href={`vlc://${activeVideoUrl}`}
                    className="px-4 py-2 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-black text-xs uppercase flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    Open in VLC (Multi-Audio)
                  </a>

                  <a
                    href={`intent:${activeVideoUrl}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;end`}
                    className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-bold text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-[#FF640A]" />
                    Open in MX Player
                  </a>

                  <a
                    href={activeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Direct Download
                  </a>
                </div>
              </div>
            )}

            {/* SKIP INTRO OVERLAY BUTTON */}
            {currentTime >= 0 && currentTime <= 90 && (
              <button
                onClick={() => jumpToTime(90)}
                className="absolute bottom-20 left-6 z-30 px-5 py-2.5 rounded-full bg-[#FF640A] text-black font-extrabold text-xs shadow-2xl flex items-center gap-2 transform hover:scale-105 transition-transform cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                SKIP INTRO (01:30)
              </button>
            )}

            {/* CONTROLS OVERLAY */}
            <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              
              {/* Crunchyroll Orange Timeline Bar */}
              <div 
                ref={progressContainerRef}
                onMouseMove={handleTimelineMouseMove}
                onMouseLeave={() => setHoverTime(null)}
                onClick={handleTimelineClick}
                className="relative w-full h-2 bg-zinc-800 rounded-full cursor-pointer mb-3"
              >
                <div 
                  className="absolute top-0 left-0 bottom-0 bg-[#FF640A] rounded-full"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between text-white text-xs gap-2">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={togglePlay} 
                    className="p-1.5 rounded-full bg-[#FF640A] text-black hover:scale-110 transition-transform cursor-pointer shadow-lg"
                    title={isPlaying ? "वीडियो रोकें (Pause)" : "वीडियो चलाएं (Play)"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>

                  {/* Toolbar Spinning Reel Badge */}
                  <div 
                    onClick={togglePlay}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 hover:border-[#FF640A] cursor-pointer transition-colors"
                    title={isPlaying ? "रील गोल-गोल घूम रही है (क्लिक करके रोकें)" : "रील रुकी हुई है (क्लिक करके चलाएं)"}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 border-dashed border-[#FF640A] flex items-center justify-center transition-transform ${
                      isPlaying ? 'animate-spin' : 'rotate-0 opacity-50'
                    }`}>
                      <div className="w-1 h-1 rounded-full bg-[#FF640A]" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-300">
                      {isPlaying ? 'घूम रहा है' : 'रुका हुआ'}
                    </span>
                  </div>

                  <button onClick={() => handleSeekOffset(-10)} className="hover:text-[#FF640A] cursor-pointer" title="Rewind 10s">
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button onClick={() => handleSeekOffset(10)} className="hover:text-[#FF640A] cursor-pointer" title="Forward 10s">
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <span className="font-mono text-[11px] text-zinc-300">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 font-semibold">
                  
                  {/* Quality Badge */}
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[#FF640A] font-bold text-[10px]">
                    {currentEpisode.quality || quality}
                  </span>

                  {/* DYNAMIC EXTRACTED AUDIO PICKER */}
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#FF640A]" />
                    <select
                      value={selectedAudioTrack?.id || ''}
                      onChange={(e) => {
                        const track = audioTracks.find(t => t.id === e.target.value);
                        if (track) handleSelectAudioTrack(track);
                      }}
                      className="bg-transparent text-[11px] text-white focus:outline-none cursor-pointer"
                      title="Select Audio Track"
                    >
                      {audioTracks.length > 0 ? (
                        audioTracks.map(t => (
                          <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                            Audio: {t.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="eng" className="bg-zinc-900">Audio: English</option>
                          <option value="jpn" className="bg-zinc-900">Audio: Japanese</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* DYNAMIC EXTRACTED SUBTITLE PICKER */}
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5">
                    <Subtitles className="w-3.5 h-3.5 text-[#FF640A]" />
                    <select
                      value={selectedSubTrack?.id || 'off'}
                      onChange={(e) => {
                        if (e.target.value === 'off') {
                          handleSelectSubTrack(null);
                        } else {
                          const track = subtitleTracks.find(s => s.id === e.target.value);
                          if (track) handleSelectSubTrack(track);
                        }
                      }}
                      className="bg-transparent text-[11px] text-white focus:outline-none cursor-pointer"
                      title="Select Subtitle Track"
                    >
                      <option value="off" className="bg-zinc-900 text-zinc-400">Subtitles: Off</option>
                      {subtitleTracks.map(s => (
                        <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                          Subs: {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subtitle Color Toggle */}
                  <button
                    onClick={() => setSubtitleColor(c => c === 'yellow' ? 'white' : 'yellow')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      subtitleColor === 'yellow' ? 'bg-amber-400 text-black' : 'bg-zinc-700 text-white'
                    }`}
                    title="Toggle Subtitle Color (Yellow / White)"
                  >
                    CC {subtitleColor === 'yellow' ? '🟡' : '⚪'}
                  </button>

                  {/* Subtitle Font Size Toggle */}
                  <button
                    onClick={() => {
                      setSubtitleFontSize(s => s === 'normal' ? 'large' : s === 'large' ? 'xlarge' : 'normal');
                    }}
                    className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300 hover:text-white cursor-pointer"
                    title="Subtitle Font Size: Normal / Large / Extra Large"
                  >
                    Size: {subtitleFontSize === 'normal' ? 'A' : subtitleFontSize === 'large' ? 'A+' : 'A++'}
                  </button>

                  {/* Speed */}
                  <button 
                    onClick={() => {
                      const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
                      setPlaybackSpeed(nextSpeed);
                      if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
                    }}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono cursor-pointer"
                  >
                    {playbackSpeed}x
                  </button>

                  {/* Quick Download Media Button */}
                  <button
                    onClick={() => setShowDownloadModal(true)}
                    className="px-2.5 py-1 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-extrabold text-[11px] flex items-center gap-1.5 shadow-md transition-transform hover:scale-105 cursor-pointer ml-1"
                    title="Download Subtitles (.VTT/.SRT), Audio (.M4A), or Video (.MKV)"
                  >
                    <Download className="w-3.5 h-3.5 fill-black" />
                    <span>Download</span>
                  </button>

                </div>
              </div>

            </div>
          </div>

          {/* ============================================================== */}
          {/* USER FEATURE: URL TRACK EXTRACTOR & DYNAMIC SWITCHER */}
          {/* "url dene ke baad url ki audio jitni hai extrect kare subtitle bhi uske baad woh lagane par video chale" */}
          {/* ============================================================== */}
          <div className="p-4 sm:p-5 bg-zinc-950 rounded-xl border border-zinc-900 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FF640A]/10 border border-[#FF640A]/30 flex items-center justify-center text-[#FF640A]">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
                    URL Media Tracks Extractor & Switcher
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      LIVE
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    URL से सभी Audio Tracks एवं Subtitles extract करें और जो लगाना चाहें उसे सेलेक्ट करके वीडियो चलाएं।
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUrlInspector(!showUrlInspector)}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
              >
                {showUrlInspector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showUrlInspector && (
              <div className="space-y-4 pt-2 border-t border-zinc-900">
                
                {/* 1. EXTRACT FROM ANY CUSTOM ANIME URL */}
                <form onSubmit={handleExtractAndPlayCustomUrl} className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-300">
                    Paste Any Anime URL to Extract Tracks & Play:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Paste anime .mkv or .mp4 URL here (e.g. https://.../anime.mkv?hash=...)"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#FF640A]"
                    />
                    <button
                      type="submit"
                      disabled={isExtractingCustomUrl || !customUrlInput.trim()}
                      className="px-4 py-2 rounded-lg bg-[#FF640A] hover:bg-[#e05300] disabled:opacity-50 text-black font-extrabold text-xs uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                    >
                      {isExtractingCustomUrl ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 fill-black" />
                          Extract & Play URL
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* 2. EXTRACTED AUDIO TRACKS LIST */}
                <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#FF640A]" />
                      Extracted Audio Tracks ({audioTracks.length})
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Active: <strong className="text-[#FF640A]">{selectedAudioTrack?.label || 'Default'}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {audioTracks.map((t) => {
                      const isSelected = selectedAudioTrack?.id === t.id;
                      return (
                        <div key={t.id} className="flex items-center">
                          <button
                            onClick={() => handleSelectAudioTrack(t)}
                            className={`px-3 py-1.5 rounded-l-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-[#FF640A] text-black shadow-lg scale-102 ring-2 ring-[#FF640A]/50'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-zinc-500" />}
                            <span>{t.label}</span>
                            {t.codec && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                                isSelected ? 'bg-black/20 text-black font-mono' : 'bg-zinc-800 text-zinc-400 font-mono'
                              }`}>
                                {t.codec}
                              </span>
                            )}
                          </button>
                          <a
                            href={`/api/media/download/audio?url=${encodeURIComponent(activeVideoUrl)}&audioIndex=${t.index}&title=${encodeURIComponent(anime.title + '_Ep' + currentEpisode.episodeNumber)}&lang=${t.language}`}
                            download
                            className="px-2 py-1.5 rounded-r-lg bg-zinc-800 hover:bg-[#FF640A] text-zinc-300 hover:text-black border-y border-r border-zinc-700 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            title={`Download ${t.label} Audio (.m4a)`}
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. EXTRACTED SUBTITLE TRACKS LIST */}
                <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <Subtitles className="w-4 h-4 text-[#FF640A]" />
                      Extracted Subtitles ({subtitleTracks.length})
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Active: <strong className="text-[#FF640A]">{selectedSubTrack?.label || 'Off'}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSelectSubTrack(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedSubTrack === null
                          ? 'bg-zinc-800 text-white border border-zinc-600'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900'
                      }`}
                    >
                      Turn Subtitles Off
                    </button>

                    {subtitleTracks.map((s) => {
                      const isSelected = selectedSubTrack?.id === s.id;
                      return (
                        <div key={s.id} className="flex items-center">
                          <button
                            onClick={() => handleSelectSubTrack(s)}
                            className={`px-3 py-1.5 rounded-l-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 text-black shadow-lg scale-102 font-black'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                            <span>{s.label}</span>
                            {s.codec && (
                              <span className="text-[9px] px-1 bg-black/20 text-black/80 font-mono rounded">
                                {s.codec}
                              </span>
                            )}
                          </button>
                          <a
                            href={`/api/media/download/subtitles?url=${encodeURIComponent(activeVideoUrl)}&subIndex=${s.index}&lang=${s.language}&title=${encodeURIComponent(anime.title + '_Ep' + currentEpisode.episodeNumber)}&format=vtt`}
                            download
                            className="px-1.5 py-1.5 bg-zinc-800 hover:bg-white text-zinc-300 hover:text-black border-y border-zinc-700 text-[10px] font-mono transition-colors cursor-pointer"
                            title={`Download ${s.label} (.VTT)`}
                          >
                            .VTT
                          </a>
                          <a
                            href={`/api/media/download/subtitles?url=${encodeURIComponent(activeVideoUrl)}&subIndex=${s.index}&lang=${s.language}&title=${encodeURIComponent(anime.title + '_Ep' + currentEpisode.episodeNumber)}&format=srt`}
                            download
                            className="px-1.5 py-1.5 rounded-r-lg bg-zinc-800 hover:bg-white text-zinc-300 hover:text-black border-y border-r border-zinc-700 text-[10px] font-mono transition-colors cursor-pointer"
                            title={`Download ${s.label} (.SRT)`}
                          >
                            .SRT
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Episode Info & Quick Actions */}
          <div className="p-4 sm:p-5 bg-zinc-950 rounded-xl border border-zinc-900 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-[#FF640A] uppercase">
                  Episode {currentEpisode.episodeNumber} • {anime.title}
                </span>
                {currentEpisode.quality && (
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-black text-[#FF640A]">
                    {currentEpisode.quality}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-900/60 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  {selectedAudioTrack?.label || currentEpisode.language || 'Multi-Audio'}
                </span>
                {selectedSubTrack && (
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-900/60 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Subtitles className="w-3 h-3" />
                    {selectedSubTrack.label}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDownloadModal(true)}
                  className="px-4 py-1.5 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-extrabold text-xs uppercase flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 fill-black" />
                  Download Media
                </button>
                <a
                  href={activeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#FF640A]" />
                  Direct Stream
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeVideoUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy video URL"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-white">{currentEpisode.title}</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {currentEpisode.synopsis || 'Full HD combined release with dual/multi-audio tracks, authentic subtitles, and chapter markers.'}
            </p>
          </div>

          {/* Interactive Dialogue Transcript & Comments Tabs */}
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 space-y-4">
            
            {/* Tab Headers */}
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
              <button
                onClick={() => setActiveInfoTab('transcript')}
                className={`text-xs font-black uppercase flex items-center gap-2 pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeInfoTab === 'transcript'
                    ? 'border-[#FF640A] text-[#FF640A]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Real Dialogue Subtitles ({subtitleCues.length} lines)
              </button>

              <button
                onClick={() => setActiveInfoTab('comments')}
                className={`text-xs font-black uppercase flex items-center gap-2 pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeInfoTab === 'comments'
                    ? 'border-[#FF640A] text-[#FF640A]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Comments & Discussion ({comments.length})
              </button>
            </div>

            {/* TAB 1: Real Dialogue Subtitle Viewer with Click-to-Jump */}
            {activeInfoTab === 'transcript' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    Active Track: <strong className="text-white">{selectedSubTrack?.label || 'None (Select a track above)'}</strong>
                  </span>
                  {selectedSubTrack && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/media/download/subtitles?url=${encodeURIComponent(activeVideoUrl)}&subIndex=${selectedSubTrack.index}&lang=${selectedSubTrack.language}&title=${encodeURIComponent(anime.title + '_Ep' + currentEpisode.episodeNumber)}&format=vtt`}
                        download
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-[#FF640A]" />
                        Download .VTT
                      </a>
                      <a
                        href={`/api/media/download/subtitles?url=${encodeURIComponent(activeVideoUrl)}&subIndex=${selectedSubTrack.index}&lang=${selectedSubTrack.language}&title=${encodeURIComponent(anime.title + '_Ep' + currentEpisode.episodeNumber)}&format=srt`}
                        download
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-[#FF640A]" />
                        Download .SRT
                      </a>
                    </div>
                  )}
                </div>

                {subtitleCues.length > 0 ? (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-2">
                    {subtitleCues.map((cue, idx) => {
                      const isActive = currentTime >= cue.start && currentTime <= cue.end;
                      return (
                        <div
                          key={idx}
                          onClick={() => jumpToTime(cue.start)}
                          className={`p-2.5 rounded-lg text-xs flex items-start gap-3 transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#FF640A]/20 border border-[#FF640A] text-white shadow-md'
                              : 'bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-900 text-zinc-300'
                          }`}
                        >
                          <span className={`font-mono text-[11px] font-bold shrink-0 px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-[#FF640A] text-black' : 'bg-black text-[#FF640A]'
                          }`}>
                            {formatTime(cue.start)}
                          </span>
                          <span className="flex-1 leading-relaxed">
                            {cue.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500 text-xs space-y-2">
                    <p>No subtitle lines loaded for the current track.</p>
                    <p className="text-zinc-600">Select any extracted subtitle track above (English, Hindi, Japanese, Spanish) to view and sync dialogue.</p>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 2: Comments */
              <div className="space-y-4">
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Join the discussion..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-white focus:outline-none focus:border-[#FF640A]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF640A] text-black font-extrabold text-xs rounded-full uppercase cursor-pointer"
                  >
                    Post
                  </button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c.id} className="p-2.5 bg-zinc-900 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[#FF640A]">{c.userName}</span>
                        <span className="text-[10px] text-zinc-500">{c.timestampTag}</span>
                      </div>
                      <p className="text-zinc-300">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Episodes Selector Sidebar (1 col) */}
        <div className="space-y-3">
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900">
            <h3 className="text-xs font-extrabold text-white uppercase mb-3">
              All Episodes ({sortedEpisodes.length})
            </h3>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {sortedEpisodes.map((ep) => {
                const isActive = ep.episodeNumber === currentEpisodeNumber && !customPlayingUrl;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setCustomPlayingUrl(null);
                      setCurrentEpisodeNumber(ep.episodeNumber);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-zinc-900 border-[#FF640A]'
                        : 'bg-black border-zinc-900 hover:bg-zinc-900'
                    }`}
                  >
                    <img 
                      src={ep.thumbnailUrl || anime.coverImage} 
                      alt={ep.title} 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = anime.coverImage;
                      }}
                      className="w-14 h-10 object-cover rounded shrink-0 bg-zinc-900" 
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold block ${isActive ? 'text-[#FF640A]' : 'text-zinc-400'}`}>
                          EP {ep.episodeNumber}
                        </span>
                        {ep.quality && (
                          <span className="text-[9px] font-extrabold text-[#FF640A] bg-black px-1 rounded">
                            {ep.quality}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{ep.title}</h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* DOWNLOAD CENTER MODAL ("और डाउनलोड भी कर सकें उसे") */}
      {/* ============================================================== */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF640A]/20 border border-[#FF640A]/40 flex items-center justify-center text-[#FF640A]">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide">
                    Download Media & Subtitle Center
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {anime.title} — Episode {currentEpisode.episodeNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. Full Video Download */}
            <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-[#FF640A]" />
                    Full Video File ({currentEpisode.quality || '1080p'})
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Includes all embedded audio tracks & multi-language subtitles in high-definition MKV container.
                  </p>
                </div>
                <a
                  href={`/api/media/download/video?url=${encodeURIComponent(activeVideoUrl)}&title=${encodeURIComponent(anime.title + '_Ep' + currentEpisode.episodeNumber)}`}
                  download
                  className="px-4 py-2 rounded-lg bg-[#FF640A] hover:bg-[#e05300] text-black font-black text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 fill-black" />
                  Video (.MKV)
                </a>
              </div>
            </div>

            {/* 2. Isolated Audio Track Download */}
            <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
              <div>
                <h4 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#FF640A]" />
                  Download Audio Tracks (.M4A / High-Quality AAC)
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Select and download isolated audio tracks for this episode.
                </p>
              </div>

              <div className="space-y-2">
                {audioTracks.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800 text-xs">
                    <span className="font-bold text-zinc-200">{a.label}</span>
                    <a
                      href={`/api/media/download/audio?url=${encodeURIComponent(activeVideoUrl)}&audioIndex=${a.index}&title=${encodeURIComponent(anime.title + '_Ep' + currentEpisode.episodeNumber)}&lang=${a.language}`}
                      download
                      className="px-3 py-1 rounded bg-zinc-800 hover:bg-[#FF640A] text-zinc-200 hover:text-black font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      Download Audio
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Subtitles Download */}
            <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3">
              <div>
                <h4 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                  <Subtitles className="w-4 h-4 text-[#FF640A]" />
                  Download Authentic Subtitle Tracks
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Download subtitles formatted for VLC, media players, or mobile video apps.
                </p>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {subtitleTracks.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded bg-zinc-900/80 border border-zinc-800 text-xs">
                    <span className="font-bold text-zinc-200 truncate pr-2">{s.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`/api/media/download/subtitles?url=${encodeURIComponent(activeVideoUrl)}&subIndex=${s.index}&lang=${s.language}&title=${encodeURIComponent(anime.title + '_Ep' + currentEpisode.episodeNumber)}&format=vtt`}
                        download
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-amber-400 text-zinc-200 hover:text-black font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        .VTT
                      </a>
                      <a
                        href={`/api/media/download/subtitles?url=${encodeURIComponent(activeVideoUrl)}&subIndex=${s.index}&lang=${s.language}&title=${encodeURIComponent(anime.title + '_Ep' + currentEpisode.episodeNumber)}&format=srt`}
                        download
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-amber-400 text-zinc-200 hover:text-black font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        .SRT
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
