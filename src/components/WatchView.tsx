import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  Settings, 
  MessageSquare, 
  ArrowLeft,
  Sparkles,
  Subtitles,
  Download,
  FileText,
  ChevronDown,
  ChevronRight,
  Check,
  CheckCircle2,
  Tv,
  Keyboard,
  Loader2,
  X,
  HardDriveDownload,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Crop,
  Server,
  Languages,
  Star,
  Bookmark,
  Share2,
  FastForward,
  SkipBack,
  SkipForward,
  Info
} from 'lucide-react';
import { Anime, Episode, Comment, MediaAudioTrack, MediaSubtitleTrack } from '../types';
import { 
  getComments, 
  addComment, 
  saveWatchProgress, 
  getWatchProgress,
  isEpisodeAvailableOffline,
  toggleEpisodeOffline,
  OFFLINE_CHANGE_EVENT 
} from '../lib/storage';
import { extractMediaTracks, simulateMediaTrackExtraction, extractTracksWithWorker } from '../lib/mediaExtractor';

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
  onSelectNextEpisode,
}) => {
  const sortedEpisodes = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
  const [currentEpisodeNumber, setCurrentEpisodeNumber] = useState<number>(initialEpisodeNumber);
  const currentEpisode = sortedEpisodes.find(e => e.episodeNumber === currentEpisodeNumber) || sortedEpisodes[0];

  const activeVideoUrl = currentEpisode?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  // Helper for playable stream URL (Fragmented MP4 remux stream for MKVs)
  const getPlayableStreamUrl = useCallback((url: string, aIndex: number = 1, server: number = 0) => {
    if (server === 1) {
      // Server 2: Universal media proxy
      return `/api/media/stream?url=${encodeURIComponent(url)}&audioIndex=${aIndex}`;
    }
    if (url.toLowerCase().includes('.mkv')) {
      return `/api/media/stream?url=${encodeURIComponent(url)}&audioIndex=${aIndex}`;
    }
    return url;
  }, []);

  const [activeServerIndex, setActiveServerIndex] = useState<number>(0);
  const [effectiveVideoSrc, setEffectiveVideoSrc] = useState<string>(() => getPlayableStreamUrl(activeVideoUrl, 1, 0));

  useEffect(() => {
    setEffectiveVideoSrc(getPlayableStreamUrl(activeVideoUrl, 1, activeServerIndex));
  }, [activeVideoUrl, activeServerIndex, getPlayableStreamUrl]);

  // Video & Container Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);

  // Crop / Aspect Ratio ('Fit' = contain, 'Cover' = cover, 'Stretch' = fill)
  const cropLabels = ['Fit', 'Cover', 'Stretch'] as const;
  const [cropIndex, setCropIndex] = useState<number>(0);

  // Screen Lock mode (Locks player controls so accidental taps don't disrupt viewing)
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Tracks & Extraction State
  const [audioTracks, setAudioTracks] = useState<MediaAudioTrack[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<MediaSubtitleTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<MediaAudioTrack | null>(null);
  const [selectedSubTrack, setSelectedSubTrack] = useState<MediaSubtitleTrack | null>(null);
  const [activeAudioMode, setActiveAudioMode] = useState<string>('जापानी (Japanese Original)');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  // Subtitle Settings & Real Cues (Compact, sleek non-intrusive defaults)
  const [subtitleFontSize, setSubtitleFontSize] = useState<number>(0.85); // Compact scale: 0.7x to 1.1x
  const [subtitleVerticalOffset, setSubtitleVerticalOffset] = useState<number>(9); // 4% to 20%
  const [subtitleColor, setSubtitleColor] = useState<'yellow' | 'white'>('yellow');
  const [subtitleCues, setSubtitleCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const [activeSubtitleText, setActiveSubtitleText] = useState<string>('');

  // Player Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // In-Player Menus: null | 'cc' | 'audio' | 'settings' | 'server'
  const [openMenu, setOpenMenu] = useState<'cc' | 'audio' | 'settings' | 'server' | null>(null);
  const [ccTab, setCcTab] = useState<'audio' | 'subtitle'>('audio');
  const [settingsTab, setSettingsTab] = useState<'speed' | 'audio' | 'subtitles'>('speed');

  // Below-Player Sheets / Drawers: null | 'download' | 'info' | 'transcript' | 'allEpisodes'
  const [activeInlineSheet, setActiveInlineSheet] = useState<'download' | 'info' | 'transcript' | 'allEpisodes' | null>(null);
  const [selectedDownloadQuality, setSelectedDownloadQuality] = useState<'1080P' | '720P' | '480P'>('1080P');
  const [dlSelectedEpisodes, setDlSelectedEpisodes] = useState<Set<number>>(new Set([initialEpisodeNumber]));

  // Skip indicator overlay animation (YouTube style)
  const [skipIndicator, setSkipIndicator] = useState<{ side: 'left' | 'right'; text: string } | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Timeline hover
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  // Visual Download & Extraction Progress Indicator State
  const [downloadProgressState, setDownloadProgressState] = useState<{
    isExtracting: boolean;
    progress: number;
    stepText: string;
    episodeTitle: string;
  }>({
    isExtracting: false,
    progress: 0,
    stepText: '',
    episodeTitle: '',
  });

  // Keyboard Shortcuts Modal State
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Offline Availability State (saved in localStorage)
  const [isOfflineAvailable, setIsOfflineAvailable] = useState<boolean>(() => {
    return currentEpisode ? isEpisodeAvailableOffline(currentEpisode.id) : false;
  });
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Fullscreen change sync listener
  useEffect(() => {
    const onFsChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  useEffect(() => {
    if (currentEpisode) {
      setIsOfflineAvailable(isEpisodeAvailableOffline(currentEpisode.id));
      setDlSelectedEpisodes(new Set([currentEpisode.episodeNumber]));
    }
  }, [currentEpisode]);

  useEffect(() => {
    const handleOfflineChanged = () => {
      if (currentEpisode) {
        setIsOfflineAvailable(isEpisodeAvailableOffline(currentEpisode.id));
      }
    };
    const handleNetOnline = () => setIsOnline(true);
    const handleNetOffline = () => setIsOnline(false);

    window.addEventListener(OFFLINE_CHANGE_EVENT, handleOfflineChanged);
    window.addEventListener('online', handleNetOnline);
    window.addEventListener('offline', handleNetOffline);

    return () => {
      window.removeEventListener(OFFLINE_CHANGE_EVENT, handleOfflineChanged);
      window.removeEventListener('online', handleNetOnline);
      window.removeEventListener('offline', handleNetOffline);
    };
  }, [currentEpisode]);

  const handleToggleOfflineAvailability = () => {
    if (!currentEpisode) return;
    const res = toggleEpisodeOffline(currentEpisode, anime);
    setIsOfflineAvailable(res.isOffline);
    if (res.isOffline) {
      showToast('💾 एपिसोड ऑफ़लाइन उपलब्ध (Available Offline) सेव हो गया! ✓');
    } else {
      showToast('🗑️ एपिसोड ऑफ़लाइन सूची से हटा दिया गया');
    }
  };

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');

  // Initial Episode Setup using ASYNCHRONOUS WEB WORKER (Off-main-thread track extraction)
  useEffect(() => {
    if (!currentEpisode) return;
    let isMounted = true;
    setIsExtracting(true);

    extractTracksWithWorker({
      url: currentEpisode.videoUrl || '',
      title: currentEpisode.title,
      language: currentEpisode.language,
      audioTracks: currentEpisode.audioTracks,
      subtitleTracks: currentEpisode.subtitleTracks,
      quality: currentEpisode.quality,
    })
      .then((extractedData) => {
        if (!isMounted) return;
        setIsExtracting(false);
        const initialAudio = extractedData.audioTracks;
        const initialSubs = extractedData.subtitleTracks;

        setAudioTracks(initialAudio);
        setSubtitleTracks(initialSubs);
        setSelectedAudioTrack(initialAudio[0] || null);
        setActiveAudioMode(initialAudio[0]?.label || 'जापानी (Japanese Original)');
        setSelectedSubTrack(initialSubs[0] || null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsExtracting(false);
        console.warn('Worker extraction fallback:', err);
        const fallback = simulateMediaTrackExtraction({
          url: currentEpisode.videoUrl || '',
          title: currentEpisode.title,
          language: currentEpisode.language,
        });
        setAudioTracks(fallback.audioTracks);
        setSubtitleTracks(fallback.subtitleTracks);
        setSelectedAudioTrack(fallback.audioTracks[0] || null);
        setActiveAudioMode(fallback.audioTracks[0]?.label || 'जापानी (Japanese Original)');
      });

    // Load saved watch progress
    const savedList = getWatchProgress();
    const saved = savedList.find(p => p.episodeId === currentEpisode.id);
    if (saved && saved.progressSeconds > 5 && videoRef.current) {
      videoRef.current.currentTime = saved.progressSeconds;
      setCurrentTime(saved.progressSeconds);
    }

    setComments(getComments(currentEpisode.id));
    setActiveSubtitleText('');

    return () => {
      isMounted = false;
    };
  }, [currentEpisode]);

  // Background Track Extraction from URL
  useEffect(() => {
    if (!activeVideoUrl) return;
    let isMounted = true;
    setIsExtracting(true);

    extractMediaTracks(activeVideoUrl)
      .then((info) => {
        if (!isMounted) return;
        setIsExtracting(false);
        if (info.audioTracks && info.audioTracks.length > 0) {
          setAudioTracks(info.audioTracks);
          if (!selectedAudioTrack) {
            setSelectedAudioTrack(info.audioTracks[0]);
            setActiveAudioMode(info.audioTracks[0].label);
          }
        }
        if (info.subtitleTracks && info.subtitleTracks.length > 0) {
          setSubtitleTracks(info.subtitleTracks);
          if (!selectedSubTrack) {
            setSelectedSubTrack(info.subtitleTracks[0]);
          }
        }
        if (info.duration && !duration) {
          setDuration(info.duration);
        }
      })
      .catch(() => {
        if (isMounted) setIsExtracting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeVideoUrl, duration, selectedAudioTrack, selectedSubTrack]);

  // Subtitles Fetcher
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

  const updateActiveSubtitle = useCallback((cur: number) => {
    if (subtitleCues.length === 0) {
      setActiveSubtitleText('');
      return;
    }
    const activeCue = subtitleCues.find(cue => cur >= cue.start && cur <= cue.end);
    setActiveSubtitleText(activeCue ? activeCue.text : '');
  }, [subtitleCues]);

  useEffect(() => {
    if (!activeVideoUrl || !selectedSubTrack) {
      setSubtitleCues([]);
      setActiveSubtitleText('');
      return;
    }

    let isMounted = true;
    const subUrl = `/api/media/subtitles?url=${encodeURIComponent(activeVideoUrl)}&subIndex=${selectedSubTrack.index}&lang=${selectedSubTrack.language}`;
    fetch(subUrl)
      .then((res) => res.text())
      .then((text) => {
        if (!isMounted) return;
        const parsed = parseVttCues(text);
        if (parsed.length > 0) {
          setSubtitleCues(parsed);
          updateActiveSubtitle(videoRef.current?.currentTime || 0);
        } else {
          // If stream has no embedded cues, clear to prevent covering the video
          setSubtitleCues([]);
          setActiveSubtitleText('');
        }
      })
      .catch(() => {
        setSubtitleCues([]);
        setActiveSubtitleText('');
      });

    return () => {
      isMounted = false;
    };
  }, [activeVideoUrl, selectedSubTrack, updateActiveSubtitle]);

  // Play / Pause Toggle
  const togglePlay = () => {
    if (isLocked) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    }
  };

  // Seek Controls with animated indicator
  const handleSeekOffset = (seconds: number) => {
    if (isLocked) return;
    if (videoRef.current) {
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration || 9999);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      updateActiveSubtitle(newTime);

      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
      setSkipIndicator({
        side: seconds < 0 ? 'left' : 'right',
        text: `${Math.abs(seconds)}s`,
      });
      skipTimeoutRef.current = setTimeout(() => {
        setSkipIndicator(null);
      }, 750);
    }
  };

  const jumpToTime = (timeInSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
      updateActiveSubtitle(timeInSeconds);
      if (!isPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  // Audio Track Selection inside Player
  // "वो ऑडियो चेंजिंग वाला सिस्टम सब वैसे ही रहे... सिर्फ प्लेयर के हिसाब से सब एडजस्ट हो जाए"
  const handleSelectAudioTrack = (track: MediaAudioTrack) => {
    setSelectedAudioTrack(track);
    setActiveAudioMode(track.label);
    setOpenMenu(null);

    const isMkv = activeVideoUrl.toLowerCase().includes('.mkv');

    if (isMkv) {
      const streamUrl = `/api/media/stream?url=${encodeURIComponent(activeVideoUrl)}&audioIndex=${track.index}`;
      setEffectiveVideoSrc(streamUrl);
      if (videoRef.current) {
        videoRef.current.src = streamUrl;
        videoRef.current.currentTime = 0;
        videoRef.current.muted = isMuted;
        videoRef.current.volume = volume;
        videoRef.current.playbackRate = playbackSpeed;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(true);
        });
      }
    } else {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = isMuted;
        videoRef.current.volume = volume;
        videoRef.current.playbackRate = playbackSpeed;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(true);
        });
      }
    }

    showToast(`🔊 ${track.label} मोड ऑन (00:00 से चालू) ⚡`);
  };

  // Subtitle Track Selection
  const handleSelectSubTrack = (track: MediaSubtitleTrack | null) => {
    setSelectedSubTrack(track);
    setOpenMenu(null);
    showToast(track ? `💬 सबटाइटल: ${track.label}` : '💬 सबटाइटल बंद (Off)');
  };

  // Playback Speed Selector (0.5x, 1x, 1.25x, 1.5x, 2x, 10x High Speed)
  const handleSelectSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    if (audioRef.current) audioRef.current.playbackRate = speed;
    setOpenMenu(null);
    showToast(`⚡ स्पीड: ${speed}x ${speed >= 2 ? '(हाई स्पीड)' : ''}`);
  };

  // Direct Download System with Visual Progress Indicator
  const startDirectDownload = (customQuality: string = selectedDownloadQuality) => {
    if (downloadProgressState.isExtracting) return;

    const safeTitle = `${anime.title}_Episode_${currentEpisode.episodeNumber}_${customQuality}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dlUrl = `/api/media/download/video?url=${encodeURIComponent(activeVideoUrl)}&title=${encodeURIComponent(safeTitle)}`;

    setDownloadProgressState({
      isExtracting: true,
      progress: 15,
      stepText: '🔍 स्ट्रीम व ऑडियो ट्रैक्स की जांच (Inspecting stream tracks)...',
      episodeTitle: `${anime.title} • Ep ${currentEpisode.episodeNumber} (${customQuality})`,
    });

    setTimeout(() => {
      setDownloadProgressState(prev => ({
        ...prev,
        progress: 45,
        stepText: '⚡ बैकग्राउंड वर्कर द्वारा ऑडियो/सबटाइटल एक्सट्रैक्शन...',
      }));
    }, 450);

    setTimeout(() => {
      setDownloadProgressState(prev => ({
        ...prev,
        progress: 80,
        stepText: `📦 ${customQuality} MP4 पैकेज तैयार हो रहा है...`,
      }));
    }, 950);

    setTimeout(() => {
      setDownloadProgressState(prev => ({
        ...prev,
        progress: 100,
        stepText: '🚀 डाउनलोड तैयार! डिवाइस में डाउनलोड शुरू हो रहा है...',
      }));

      const a = document.createElement('a');
      a.href = dlUrl;
      a.setAttribute('download', `${safeTitle}.mp4`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast('🚀 वीडियो डाउनलोड शुरू हो गया!');

      setTimeout(() => {
        setDownloadProgressState(prev => ({ ...prev, isExtracting: false }));
        setActiveInlineSheet(null);
      }, 2000);
    }, 1500);
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen && !document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      const elem = containerRef.current as any;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(true));
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else {
        setIsFullscreen(true);
      }
      showToast('🖥️ फुल स्क्रीन मोड चालू (Fullscreen ON)');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
      showToast('📱 फुल स्क्रीन मोड बंद (Fullscreen OFF)');
    }
  };

  // Mute / Unmute
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
    showToast(next ? '🔇 आवाज़ बंद (Muted)' : '🔊 आवाज़ चालू (Unmuted)');
  };

  // Volume slider handler
  const handleVolumeChange = (newVal: number) => {
    const clamped = Math.max(0, Math.min(1, newVal));
    setVolume(clamped);
    if (clamped > 0 && isMuted) setIsMuted(false);
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
    }
  };

  // Format time (MM:SS or HH:MM:SS)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Timeline events
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setCurrentTime(cur);
      setDuration(dur);
      updateActiveSubtitle(cur);
      if (cur > 3 && currentEpisode) {
        saveWatchProgress({
          animeId: anime.id,
          episodeId: currentEpisode.id,
          episodeNumber: currentEpisode.episodeNumber,
          progressSeconds: cur,
          durationSeconds: dur,
          lastWatchedAt: new Date().toISOString()
        });
      }
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !videoRef.current || !duration) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * duration;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    updateActiveSubtitle(target);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !duration) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
  };

  // Controls Visibility Timer
  const handleMouseMove = () => {
    if (isLocked) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!openMenu) setShowControls(false);
      }, 3500);
    }
  };

  // Post comment
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentEpisode) return;
    const newComm = addComment(currentEpisode.id, 'AnimeFan', commentText.trim(), formatTime(currentTime));
    setComments([newComm, ...comments]);
    setCommentText('');
    showToast('💬 कमेंट जोड़ा गया!');
  };

  // Next Episode handler
  const handleNextEpisode = () => {
    const nextEp = sortedEpisodes.find(e => e.episodeNumber === currentEpisodeNumber + 1);
    if (nextEp) {
      setCurrentEpisodeNumber(nextEp.episodeNumber);
      setIsPlaying(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`🎬 Episode ${nextEp.episodeNumber} शुरू हो रहा है...`);
      if (onSelectNextEpisode) onSelectNextEpisode(nextEp.episodeNumber);
    } else {
      showToast('यह सीरीज़ का अंतिम एपिसोड है!');
    }
  };

  const hasNextEpisode = sortedEpisodes.some(e => e.episodeNumber === currentEpisodeNumber + 1);

  if (!currentEpisode) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-24 select-none">
      
      {/* ============================================================== */}
      {/* TOP HEADER: Back button + Title + Spinning Reel Status */}
      {/* ============================================================== */}
      <div className={`${isTheaterMode ? 'max-w-full px-6' : 'max-w-7xl px-4'} mx-auto py-3 flex flex-wrap items-center justify-between gap-3`}>
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-2 text-xs font-black uppercase transition-colors cursor-pointer hover:border-[#FF640A]"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF640A]" />
          Back to {anime.title}
        </button>

        {/* FAST-SPINNING REEL STATUS WIDGET ("जल्दी चरका चले yaar") */}
        <div 
          onClick={togglePlay}
          className="flex items-center gap-2.5 bg-zinc-900/90 border border-zinc-800 rounded-full px-3.5 py-1.5 shadow-xl cursor-pointer hover:border-[#FF640A] transition-all group"
          title={isPlaying ? "वीडियो चल रहा है: चरखा तेज़ घूम रहा है" : "वीडियो रुका हुआ है: चरखा बंद है"}
        >
          <div className={`relative w-6 h-6 rounded-full border-2 border-dashed border-[#FF640A] flex items-center justify-center transition-all ${
            isPlaying ? 'animate-[spin_0.8s_linear_infinite] shadow-[0_0_12px_rgba(255,100,10,0.9)]' : 'rotate-0 opacity-60'
          }`}>
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-[#FF640A] flex items-center justify-center">
              <div className={`w-1 h-1 rounded-full ${isPlaying ? 'bg-[#FF640A] animate-ping' : 'bg-[#FF640A]'}`} />
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-white">
            {isPlaying ? 'चरखा तेज़ चल रहा है' : 'चरखा रुका हुआ है'}
          </span>
        </div>

        {/* Anime Title & Episode Tag + Offline status */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">Ep {currentEpisode.episodeNumber}:</span>
            <span className="text-xs font-black text-[#FF640A] max-w-xs truncate">{currentEpisode.title}</span>
          </div>

          {!isOnline && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-300 text-[11px] font-bold">
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              ऑफ़लाइन मोड
            </span>
          )}

          <button
            onClick={handleToggleOfflineAvailability}
            className={`px-3 py-1.5 rounded-full border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              isOfflineAvailable
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
            }`}
            title={isOfflineAvailable ? "ऑफ़लाइन उपलब्ध है (हटाने के लिए क्लिक करें)" : "बिना इंटरनेट देखने के लिए ऑफ़लाइन सेव करें"}
          >
            <HardDriveDownload className={`w-3.5 h-3.5 ${isOfflineAvailable ? 'text-emerald-400' : 'text-zinc-400'}`} />
            <span>{isOfflineAvailable ? '✓ ऑफ़लाइन उपलब्ध' : 'ऑफ़लाइन सेव करें'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIDEO PLAYER CONTAINER (ALL CONTROLS INTEGRATED INSIDE) */}
      {/* ============================================================== */}
      <div className={`${isTheaterMode ? 'max-w-full px-2 sm:px-6' : 'max-w-7xl px-4'} mx-auto transition-all duration-300`}>
        
        <div 
          ref={containerRef}
          id="video-player-container"
          className={`relative w-full aspect-video bg-black overflow-hidden shadow-2xl group transition-all select-none ${
            isFullscreen 
              ? 'fixed inset-0 z-[99999] w-screen h-screen rounded-none max-w-none max-h-none border-none flex items-center justify-center' 
              : 'rounded-2xl border border-zinc-900'
          }`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            if (isPlaying && !openMenu && !isLocked) setShowControls(false);
          }}
          onClick={() => {
            if (isLocked) {
              setShowControls(true);
              if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
              controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
            }
          }}
        >
          {/* Audio element for custom isolated audio tracks if ever needed */}
          <audio ref={audioRef} preload="auto" className="hidden" />

          {/* HTML5 Video with dynamic object-fit based on Crop Selection */}
          <video
            ref={videoRef}
            src={effectiveVideoSrc}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setIsPlaying(false);
              if (hasNextEpisode) handleNextEpisode();
            }}
            onClick={togglePlay}
            playsInline
            preload="auto"
            className={`w-full h-full cursor-pointer transition-all ${
              cropIndex === 1 ? 'object-cover' : cropIndex === 2 ? 'object-fill' : 'object-contain'
            }`}
          />

          {/* YouTube-style Skip Ripple Animation */}
          {skipIndicator && (
            <div className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center ${
              skipIndicator.side === 'left' ? 'left-12 sm:left-24' : 'right-12 sm:right-24'
            }`}>
              <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-black/75 backdrop-blur-md border border-[#FF640A]/40 text-white animate-ping">
                <span className="text-xl font-black text-[#FF640A]">
                  {skipIndicator.side === 'left' ? '‹‹' : '››'}
                </span>
                <span className="text-xs font-bold tracking-wider">{skipIndicator.text}</span>
              </div>
            </div>
          )}

          {/* COMPACT & SLEEK SUBTITLE DISPLAY OVERLAY */}
          {selectedSubTrack && activeSubtitleText && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 z-30 max-w-[80%] pointer-events-none text-center transition-all px-2"
              style={{ bottom: `${subtitleVerticalOffset}%` }}
            >
              <span 
                className={`inline-block font-sans font-semibold tracking-normal px-2.5 py-0.5 rounded text-center leading-snug backdrop-blur-[1px] transition-all ${
                  subtitleColor === 'yellow'
                    ? 'text-[#FFE800] bg-black/70 shadow-[0_1px_3px_rgba(0,0,0,0.85)]'
                    : 'text-white bg-black/70 shadow-[0_1px_3px_rgba(0,0,0,0.85)]'
                }`}
                style={{ fontSize: `${Math.max(0.72, subtitleFontSize * 0.82)}rem` }}
              >
                {activeSubtitleText}
              </span>
            </div>
          )}

          {/* FLOATING TOAST NOTIFICATION */}
          {toastMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-950/95 border border-[#FF640A] text-white text-xs font-extrabold shadow-2xl flex items-center gap-2 animate-bounce pointer-events-none">
              <Sparkles className="w-4 h-4 text-[#FF640A]" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* SCREEN LOCKED FLOATING UNLOCK BUTTON */}
          {isLocked && showControls && (
            <div className="absolute top-4 right-4 z-50 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setIsLocked(false);
                  showToast('🔓 स्क्रीन अनलॉक (Controls Unlocked)');
                }}
                className="px-4 py-2 rounded-full bg-[#FF640A] text-black font-black text-xs shadow-2xl flex items-center gap-2 hover:scale-105 transition-all cursor-pointer ring-2 ring-white/50"
              >
                <Unlock className="w-4 h-4 text-black" />
                <span>स्क्रीन अनलॉक करें</span>
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* IN-PLAYER CONTROLS LAYER (TOP, CENTER, BOTTOM) */}
          {/* ============================================================== */}
          {!isLocked && (
            <div className={`absolute inset-0 z-20 flex flex-col justify-between text-white transition-opacity duration-300 pointer-events-none ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`}>
              
              {/* TOP CONTROLS ROW INSIDE PLAYER */}
              <div className="flex items-center justify-between gap-2 p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-auto">
                
                {/* Top Left: Back + Anime & Episode Badge + Active Audio Mode */}
                <div className="flex items-center gap-2 max-w-[65%] truncate">
                  <button
                    onClick={onBack}
                    className="w-8 h-8 rounded-full bg-black/70 hover:bg-[#FF640A] hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col truncate">
                    <span className="text-xs font-black truncate text-white">
                      {anime.title} • Ep {currentEpisode.episodeNumber}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {selectedAudioTrack?.label || activeAudioMode} मोड ऑन
                    </span>
                  </div>
                </div>

                {/* Top Right: Crop, Server, CC button, Lock */}
                <div className="flex items-center gap-1.5 shrink-0">
                  
                  {/* Crop Selector ('Fit' / 'Cover' / 'Stretch') */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = (cropIndex + 1) % 3;
                      setCropIndex(next);
                      showToast(`📐 Crop: ${cropLabels[next]}`);
                    }}
                    className="h-7 px-2.5 rounded-full bg-black/70 hover:bg-zinc-800 border border-white/20 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Aspect Ratio (Fit / Cover / Stretch)"
                  >
                    <Crop className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{cropLabels[cropIndex]}</span>
                  </button>

                  {/* Server Switcher */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === 'server' ? null : 'server');
                      }}
                      className={`h-7 px-2.5 rounded-full border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        openMenu === 'server'
                          ? 'bg-[#FF640A] text-black border-[#FF640A]'
                          : 'bg-black/70 hover:bg-zinc-800 border-white/20 text-zinc-200'
                      }`}
                      title="Switch Stream Server"
                    >
                      <Server className="w-3.5 h-3.5" />
                      <span>{activeServerIndex === 0 ? 'Server 1' : 'Server 2'}</span>
                    </button>

                    {/* Server Dropdown */}
                    {openMenu === 'server' && (
                      <div className="absolute top-9 right-0 w-44 bg-zinc-950/95 border border-zinc-800 rounded-xl p-2 shadow-2xl space-y-1 z-50">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 px-2 block">
                          स्ट्रीम सर्वर चुनें
                        </span>
                        {[
                          { id: 0, name: 'Server 1 (Direct Stream)' },
                          { id: 1, name: 'Server 2 (Proxy Stream)' }
                        ].map((srv) => (
                          <button
                            key={srv.id}
                            onClick={() => {
                              setActiveServerIndex(srv.id);
                              setOpenMenu(null);
                              showToast(`🌐 ${srv.name} कनेक्ट हो गया`);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer ${
                              activeServerIndex === srv.id
                                ? 'bg-[#FF640A] text-black font-black'
                                : 'hover:bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            <span>{srv.name}</span>
                            {activeServerIndex === srv.id && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Unified CC Button (Audio + Subtitles) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu === 'cc' ? null : 'cc');
                    }}
                    className={`h-7 px-2.5 rounded-full border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      openMenu === 'cc' || selectedSubTrack
                        ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                        : 'bg-black/70 hover:bg-zinc-800 border-white/20 text-zinc-200'
                    }`}
                    title="Audio Tracks & Subtitles (CC)"
                  >
                    <Subtitles className="w-3.5 h-3.5" />
                    <span>CC</span>
                  </button>

                  {/* Screen Lock Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLocked(true);
                      showToast('🔒 स्क्रीन लॉक मोड चालू (Accidental touch protection)');
                    }}
                    className="w-7 h-7 rounded-full bg-black/70 hover:bg-zinc-800 border border-white/20 flex items-center justify-center transition-all cursor-pointer text-zinc-300"
                    title="Lock screen controls"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CENTER PLAYBACK CONTROLS (Rewind, Big Primary Play/Pause, Forward) */}
              <div className="flex items-center justify-center gap-8 sm:gap-12 pointer-events-auto my-auto">
                {/* Rewind -10s */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeekOffset(-10);
                  }}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/75 hover:bg-[#FF640A] hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="10s पीछे (Rewind -10s)"
                >
                  <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Primary 58px Play/Pause Circle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF640A] text-black hover:scale-110 active:scale-95 shadow-[0_0_25px_rgba(255,100,10,0.85)] flex items-center justify-center transition-all cursor-pointer"
                  title={isPlaying ? "वीडियो रोकें (Pause)" : "वीडियो चलाएं (Play)"}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
                  )}
                </button>

                {/* Forward +10s */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeekOffset(10);
                  }}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/75 hover:bg-[#FF640A] hover:text-black border border-white/20 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="10s आगे (Forward +10s)"
                >
                  <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* BOTTOM CONTROLS BAR (Timeline, Time, Volume, Speed, Audio, CC, Next, Download, Settings, Fullscreen) */}
              <div className="p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-auto">
                
                {/* Timeline Bar */}
                <div 
                  ref={progressContainerRef}
                  onMouseMove={handleTimelineMouseMove}
                  onMouseLeave={() => setHoverTime(null)}
                  onClick={handleTimelineClick}
                  className="relative w-full h-2 hover:h-2.5 bg-zinc-800/90 rounded-full cursor-pointer mb-2.5 transition-all group/timeline"
                >
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-[#FF640A] rounded-full transition-all"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover/timeline:opacity-100 transition-opacity"
                    style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  {hoverTime !== null && (
                    <div 
                      className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-zinc-700 text-[10px] font-mono text-white pointer-events-none"
                      style={{ left: `${(hoverTime / (duration || 1)) * 100}%` }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  )}
                </div>

                {/* Control Chips Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  
                  {/* Left: Time & Volume */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-zinc-300 tabular-nums">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    {/* Volume button + hover slider */}
                    <div className="flex items-center gap-1.5 group/vol">
                      <button
                        onClick={toggleMute}
                        className="p-1 rounded-full text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-14 sm:w-18 h-1 accent-[#FF640A] bg-zinc-700 rounded-lg cursor-pointer transition-all"
                      />
                    </div>
                  </div>

                  {/* Right: Speed, Audio Chip, CC Subtitle, Next, Download, Settings, Fullscreen */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    
                    {/* Playback Speed Chip */}
                    <button
                      onClick={() => {
                        const speeds = [1, 1.25, 1.5, 2, 0.5];
                        const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length] ?? 1;
                        handleSelectSpeed(next);
                      }}
                      className={`h-7 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        playbackSpeed !== 1
                          ? 'bg-[#FF640A] text-black font-black'
                          : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                      }`}
                      title="Toggle Speed (0.5x, 1x, 1.25x, 1.5x, 2x)"
                    >
                      {playbackSpeed}x
                    </button>

                    {/* In-Player Audio Track Chip (Direct, Compact Audio Language Switcher) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === 'audio' ? null : 'audio');
                      }}
                      className={`h-7 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer max-w-[130px] truncate ${
                        openMenu === 'audio'
                          ? 'bg-[#FF640A] text-black font-black'
                          : selectedAudioTrack
                          ? 'bg-[#FF640A]/20 text-[#FF640A] border border-[#FF640A]/40'
                          : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                      }`}
                      title="ऑडियो भाषा बदलें (Change Audio Language)"
                    >
                      <span>🎧</span>
                      <span className="truncate">{selectedAudioTrack?.label.split(' ')[0] || 'Audio'}</span>
                      <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                    </button>

                    {/* Next Episode Button */}
                    {hasNextEpisode && (
                      <button
                        onClick={handleNextEpisode}
                        className="h-7 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-[11px] font-bold flex items-center gap-0.5 transition-all cursor-pointer"
                        title="Next Episode"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}

                    {/* In-Player Download & Offline Button */}
                    <button
                      onClick={() => setActiveInlineSheet(activeInlineSheet === 'download' ? null : 'download')}
                      className={`h-7 px-2.5 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                        isOfflineAvailable
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-zinc-900/90 hover:bg-[#FF640A] hover:text-black text-zinc-200 border border-zinc-800'
                      }`}
                      title="Download or Save Episode Offline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">डाउनलोड</span>
                    </button>

                    {/* Settings Gear */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === 'settings' ? null : 'settings');
                      }}
                      className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        openMenu === 'settings'
                          ? 'bg-[#FF640A] text-black'
                          : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                      }`}
                      title="Player Settings"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      onClick={toggleFullscreen}
                      className="h-7 w-7 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 flex items-center justify-center transition-all cursor-pointer"
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen (F)"}
                    >
                      {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                    </button>

                  </div>
                </div>

              </div>

            </div>
          )}


          {/* ============================================================== */}
          {/* COMPACT AUDIO / LANGUAGE SELECTOR POPUP (DIRECT CLICK TO CHANGE) */}
          {/* ============================================================== */}
          {openMenu === 'audio' && (
            <div 
              data-player-panel="true"
              className="absolute bottom-14 right-16 sm:right-28 z-40 w-48 sm:w-52 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-xl p-1.5 shadow-2xl space-y-1 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-850">
                <span className="text-[10px] font-black uppercase text-[#FF640A] flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  ऑडियो भाषा (Audio)
                </span>
                <button
                  onClick={() => setOpenMenu(null)}
                  className="w-4 h-4 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-0.5">
                {audioTracks.map((t) => {
                  const isSelected = selectedAudioTrack?.id === t.id;
                  const flag = t.language === 'hin' ? '🇮🇳' : t.language === 'eng' ? '🇬🇧' : t.language === 'kor' ? '🇰🇷' : '🇯🇵';
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        handleSelectAudioTrack(t);
                        setOpenMenu(null); // Direct instant switch & close
                      }}
                      className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF640A] text-black font-black shadow-sm'
                          : 'hover:bg-zinc-850 text-zinc-200'
                      }`}
                      title={`${t.label} (क्लिक करते ही तुरंत चालू होगा)`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs">{flag}</span>
                        <span className="truncate">{t.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* COMPACT CC SUBTITLES POPUP (SLEEK & NON-INTRUSIVE) */}
          {/* ============================================================== */}
          {openMenu === 'cc' && (
            <div 
              data-player-panel="true"
              className="absolute top-12 right-4 sm:right-8 z-40 w-48 sm:w-52 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-xl p-1.5 shadow-2xl space-y-1 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-850">
                <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                  <Subtitles className="w-3 h-3" />
                  सबटाइटल (Subtitles)
                </span>
                <button
                  onClick={() => setOpenMenu(null)}
                  className="w-4 h-4 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    handleSelectSubTrack(null);
                    setOpenMenu(null);
                  }}
                  className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold text-left flex items-center justify-between cursor-pointer ${
                    selectedSubTrack === null
                      ? 'bg-amber-400 text-black font-black'
                      : 'hover:bg-zinc-850 text-zinc-300'
                  }`}
                >
                  <span>सबटाइटल बंद (Off)</span>
                  {selectedSubTrack === null && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>

                {subtitleTracks.map((sub) => {
                  const isSelected = selectedSubTrack?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        handleSelectSubTrack(sub);
                        setOpenMenu(null);
                      }}
                      className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-bold text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-black font-black'
                          : 'hover:bg-zinc-850 text-zinc-200'
                      }`}
                    >
                      <span className="truncate">{sub.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Compact Subtitle Size Controls */}
              <div className="border-t border-zinc-850 pt-1.5 px-1 flex items-center justify-between text-[10px] text-zinc-400">
                <span>साइज़ (Size):</span>
                <div className="flex gap-1">
                  {[
                    { s: 0.7, label: 'A-' },
                    { s: 0.85, label: 'A' },
                    { s: 1.0, label: 'A+' }
                  ].map(({ s, label }) => (
                    <button
                      key={s}
                      onClick={() => setSubtitleFontSize(s)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        Math.abs(subtitleFontSize - s) < 0.05
                          ? 'bg-amber-400 text-black font-black'
                          : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                      }`}
                      title={`Subtitle Font Scale ${s}x`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* IN-PLAYER POPUP 2: SETTINGS MODAL */}
          {/* ============================================================== */}
          {openMenu === 'settings' && (
            <div 
              data-player-panel="true"
              className="absolute bottom-14 right-4 sm:right-8 z-40 w-60 max-w-[90vw] bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-xl p-2.5 shadow-2xl space-y-2 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-black uppercase text-[#FF640A] flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  प्लेयर सेटिंग (Settings)
                </span>
                <button
                  onClick={() => setOpenMenu(null)}
                  className="w-6 h-6 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Tabs: Speed, Audio, Subtitles */}
              <div className="flex gap-1 border-b border-zinc-850 pb-2">
                {(['speed', 'audio', 'subtitles'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSettingsTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                      settingsTab === tab ? 'bg-[#FF640A] text-black font-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-850'
                    }`}
                  >
                    {tab === 'speed' ? 'Speed' : tab === 'audio' ? 'Audio' : 'Subtitles'}
                  </button>
                ))}
              </div>

              {settingsTab === 'speed' && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 block mb-1">प्लेबैक स्पीड चुनें:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2, 10].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSelectSpeed(spd)}
                        className={`py-1.5 rounded-lg text-xs font-bold text-center cursor-pointer transition-all ${
                          playbackSpeed === spd
                            ? 'bg-[#FF640A] text-black font-black shadow'
                            : spd === 10
                            ? 'bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800'
                            : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
                        }`}
                      >
                        {spd === 1 ? '1x (Normal)' : spd === 10 ? '10x (तूफ़ानी)' : `${spd}x`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {settingsTab === 'audio' && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {audioTracks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectAudioTrack(t)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer ${
                        selectedAudioTrack?.id === t.id
                          ? 'bg-[#FF640A] text-black font-black'
                          : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300'
                      }`}
                    >
                      <span>{t.label}</span>
                      {selectedAudioTrack?.id === t.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}

              {settingsTab === 'subtitles' && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <button
                    onClick={() => handleSelectSubTrack(null)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer ${
                      selectedSubTrack === null ? 'bg-amber-400 text-black font-black' : 'bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <span>Off</span>
                    {selectedSubTrack === null && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {subtitleTracks.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSubTrack(sub)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-left flex items-center justify-between cursor-pointer ${
                        selectedSubTrack?.id === sub.id ? 'bg-amber-400 text-black font-black' : 'bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <span>{sub.label}</span>
                      {selectedSubTrack?.id === sub.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ============================================================== */}
        {/* BELOW PLAYER ACTION BAR & EPISODE PICKER (CLEAN, INTEGRATED) */}
        {/* ============================================================== */}
        <div className="w-full px-2 sm:px-4 pt-3.5 pb-2">
          
          {/* Anime Meta Details + Info Drawer Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                {anime.title}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {anime.rating}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{selectedAudioTrack?.label || anime.language}</span>
                <span>•</span>
                <span>Episode {currentEpisode.episodeNumber} of {sortedEpisodes.length}</span>
                <span>•</span>
                <span className="capitalize">{anime.type}</span>
              </div>
            </div>

            {/* Info Drawer Button */}
            <button
              onClick={() => setActiveInlineSheet(activeInlineSheet === 'info' ? null : 'info')}
              className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-[#FF640A]" />
              <span>Info</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Row: Save Offline / Download, Add to List, Share, Subtitle Transcript */}
          <div className="grid grid-cols-4 gap-2 mt-3.5">
            
            {/* Download & Offline Drawer Trigger */}
            <button
              onClick={() => setActiveInlineSheet(activeInlineSheet === 'download' ? null : 'download')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activeInlineSheet === 'download' || isOfflineAvailable
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-zinc-800'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">{isOfflineAvailable ? '✓ ऑफ़लाइन सेव' : 'डाउनलोड'}</span>
            </button>

            {/* Offline Save Direct Toggle */}
            <button
              onClick={handleToggleOfflineAvailability}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                isOfflineAvailable
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-zinc-800'
              }`}
              title="बिना इंटरनेट देखने के लिए ऑफ़लाइन सेव करें"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-[#FF640A]" />
              <span className="truncate">{isOfflineAvailable ? 'ऑफ़लाइन सक्रिय' : 'ऑफ़लाइन रखें'}</span>
            </button>

            {/* Subtitle Dialogue / Transcript Drawer */}
            <button
              onClick={() => setActiveInlineSheet(activeInlineSheet === 'transcript' ? null : 'transcript')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activeInlineSheet === 'transcript'
                  ? 'bg-amber-400/20 text-amber-400 border-amber-400/40 shadow'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-zinc-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">डायलॉग</span>
            </button>

            {/* Theater Mode Button */}
            <button
              onClick={() => {
                setIsTheaterMode(!isTheaterMode);
                showToast(!isTheaterMode ? '📺 थियेटर मोड चालू' : 'सामान्य मोड चालू');
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 cursor-pointer transition-colors"
            >
              <Tv className="w-3.5 h-3.5 text-zinc-400" />
              <span className="truncate">{isTheaterMode ? 'नॉर्मल' : 'बड़ा प्लेयर'}</span>
            </button>

          </div>

          {/* Episode Picker Strip ("Resources / Episodes" - horizontal scroll with All button) */}
          <div className="mt-4 pt-3 border-t border-zinc-900">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                एपिसोड चुनें (Episodes)
              </span>
              <span className="text-[11px] font-bold text-[#FF640A]">
                Ep {currentEpisode.episodeNumber} चल रहा है
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveInlineSheet(activeInlineSheet === 'allEpisodes' ? null : 'allEpisodes')}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-black text-zinc-200 cursor-pointer"
              >
                All ({sortedEpisodes.length})
              </button>

              {sortedEpisodes.map((ep) => {
                const isActive = ep.episodeNumber === currentEpisodeNumber;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setCurrentEpisodeNumber(ep.episodeNumber);
                      setIsPlaying(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`shrink-0 w-11 h-10 rounded-xl text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#FF640A] text-black shadow-lg shadow-orange-500/30 scale-105'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-850'
                    }`}
                  >
                    {String(ep.episodeNumber).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ============================================================== */}
      {/* INLINE DRAWER 1: DOWNLOAD & SAVE OFFLINE IN LOCALSTORAGE */}
      {/* ============================================================== */}
      {activeInlineSheet === 'download' && (
        <div className={`${isTheaterMode ? 'max-w-full px-6' : 'max-w-7xl px-4'} mx-auto mt-4 animate-in fade-in slide-in-from-top-3`}>
          <div className="p-4 sm:p-5 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#FF640A]" />
                <h3 className="text-sm sm:text-base font-black text-white">
                  एपिसोड डाउनलोड व ऑफ़लाइन उपलब्धता (Download & Offline Storage)
                </h3>
              </div>
              <button
                onClick={() => setActiveInlineSheet(null)}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quality Picker Cards (1080P, 720P, 480P) */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-400">1. वीडियो क्वालिटी चुनें (Select Quality):</span>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { q: '1080P' as const, desc: 'Full HD • ~650 MB', badge: 'Ultra Crisp' },
                  { q: '720P' as const, desc: 'HD • ~380 MB', badge: 'Standard' },
                  { q: '480P' as const, desc: 'SD • ~180 MB', badge: 'Data Saver' },
                ].map(({ q, desc, badge }) => (
                  <button
                    key={q}
                    onClick={() => setSelectedDownloadQuality(q)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedDownloadQuality === q
                        ? 'bg-[#FF640A]/15 border-[#FF640A] text-white shadow-lg shadow-orange-500/10'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{q}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold">{badge}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 block mt-1">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Offline Storage in LocalStorage Card */}
            <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <HardDriveDownload className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black text-white">
                    बिना इंटरनेट देखने हेतु ऑफ़लाइन सेव करें (Available Offline in localStorage)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  यह एपिसोड आपके ब्राउज़र के ऑफ़लाइन स्टोरेज (localStorage cache) में सुरक्षित रहेगा जिससे इंटरनेट न होने पर भी आप इसे देख सकते हैं।
                </p>
              </div>

              <button
                onClick={handleToggleOfflineAvailability}
                className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 ${
                  isOfflineAvailable
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isOfflineAvailable ? '✓ ऑफ़लाइन उपलब्ध है' : 'ऑफ़लाइन सेव करें'}</span>
              </button>
            </div>

            {/* Direct Device Download Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => startDirectDownload(selectedDownloadQuality)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#FF640A] hover:bg-[#e05300] text-black font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{selectedDownloadQuality} MP4 डिवाइस में डाउनलोड करें</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* INLINE DRAWER 2: INFO SHEET */}
      {/* ============================================================== */}
      {activeInlineSheet === 'info' && (
        <div className={`${isTheaterMode ? 'max-w-full px-6' : 'max-w-7xl px-4'} mx-auto mt-4 animate-in fade-in slide-in-from-top-3`}>
          <div className="p-4 sm:p-5 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-[#FF640A]" />
                {anime.title} विवरण (Details & Storyline)
              </h3>
              <button
                onClick={() => setActiveInlineSheet(null)}
                className="w-6 h-6 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={anime.thumbnail}
                alt={anime.title}
                className="w-24 sm:w-32 aspect-[2/3] object-cover rounded-xl border border-zinc-800 shrink-0"
              />
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  {anime.genres.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded-full bg-zinc-900 text-[10px] font-bold text-zinc-300">
                      {g}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded-full bg-orange-950/60 border border-orange-800 text-[10px] font-bold text-[#FF640A]">
                    {anime.language}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {currentEpisode.synopsis || anime.synopsis}
                </p>
                <div className="text-[11px] text-zinc-400 pt-1 space-y-0.5">
                  <p><span className="text-zinc-200 font-bold">Rating:</span> ⭐ {anime.rating} / 10</p>
                  <p><span className="text-zinc-200 font-bold">Total Episodes:</span> {sortedEpisodes.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* INLINE DRAWER 3: SUBTITLE TRANSCRIPT DRAWER */}
      {/* ============================================================== */}
      {activeInlineSheet === 'transcript' && (
        <div className={`${isTheaterMode ? 'max-w-full px-6' : 'max-w-7xl px-4'} mx-auto mt-4 animate-in fade-in slide-in-from-top-3`}>
          <div className="p-4 bg-zinc-950 rounded-2xl border border-amber-500/30 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white uppercase">
                  लिखने वाला सबटाइटल डायलॉग ({subtitleCues.length} पंक्तियाँ)
                </h3>
              </div>
              <button
                onClick={() => setActiveInlineSheet(null)}
                className="text-xs text-zinc-400 hover:text-white font-bold cursor-pointer"
              >
                ✕ बंद करें
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-2">
              {subtitleCues.map((cue, idx) => {
                const isActive = currentTime >= cue.start && currentTime <= cue.end;
                return (
                  <div
                    key={idx}
                    onClick={() => jumpToTime(cue.start)}
                    className={`p-2 rounded-xl text-xs flex items-start gap-3 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-amber-400/20 border border-amber-400 text-white font-bold shadow-md'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-900 text-zinc-300'
                    }`}
                  >
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-amber-400 text-black font-black' : 'bg-black text-amber-400'
                    }`}>
                      {formatTime(cue.start)}
                    </span>
                    <span className="flex-1 leading-relaxed">{cue.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* INLINE DRAWER 4: ALL EPISODES GRID MODAL */}
      {/* ============================================================== */}
      {activeInlineSheet === 'allEpisodes' && (
        <div className={`${isTheaterMode ? 'max-w-full px-6' : 'max-w-7xl px-4'} mx-auto mt-4 animate-in fade-in slide-in-from-top-3`}>
          <div className="p-4 sm:p-5 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <h3 className="text-sm font-black uppercase text-white">
                सभी एपिसोड सूची (All Episodes • {sortedEpisodes.length})
              </h3>
              <button
                onClick={() => setActiveInlineSheet(null)}
                className="w-6 h-6 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-72 overflow-y-auto pr-1">
              {sortedEpisodes.map((ep) => {
                const isActive = ep.episodeNumber === currentEpisodeNumber;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setCurrentEpisodeNumber(ep.episodeNumber);
                      setIsPlaying(true);
                      setActiveInlineSheet(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`aspect-square rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-[#FF640A] text-black font-black shadow-lg shadow-orange-500/30 scale-105'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400 font-normal">Ep</span>
                    <span className="text-sm font-black">{ep.episodeNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* LOWER CONTENT: Episode Info, Comments, and Episode List */}
      {/* ============================================================== */}
      <div className={`${isTheaterMode ? 'max-w-full px-6' : 'max-w-7xl px-4'} mx-auto mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6`}>
        
        {/* Main Content (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Episode Info Box */}
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-[#FF640A] uppercase tracking-wider">
                  Episode {currentEpisode.episodeNumber} • {anime.title}
                </span>
                {currentEpisode.quality && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-black text-[#FF640A]">
                    {currentEpisode.quality}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-900/70 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  {selectedAudioTrack?.label || 'Hindi + Japanese Dual Audio'}
                </span>
                {selectedSubTrack && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-900/70 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Subtitles className="w-3 h-3" />
                    {selectedSubTrack.label}
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveInlineSheet('download')}
                className="px-3 py-1.5 rounded-full bg-[#FF640A]/10 hover:bg-[#FF640A] text-[#FF640A] hover:text-black border border-[#FF640A]/30 font-black text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                डाउनलोड विकल्प
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white">{currentEpisode.title}</h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {currentEpisode.synopsis || 'Full HD official release with dual/multi-audio tracks, authentic subtitles, and chapter markers.'}
            </p>
          </div>

          {/* Comments Section */}
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <MessageSquare className="w-4 h-4 text-[#FF640A]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Comments & Discussions ({comments.length})
              </h3>
            </div>

            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write your comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-white focus:outline-none focus:border-[#FF640A]"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#FF640A] hover:bg-[#e05300] text-black font-extrabold text-xs rounded-full uppercase cursor-pointer transition-colors"
              >
                Post
              </button>
            </form>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="p-3 bg-zinc-900/80 rounded-xl text-xs space-y-1 border border-zinc-850">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[#FF640A]">{c.userName}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{c.timestampTag}</span>
                  </div>
                  <p className="text-zinc-300">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Episodes Selector Sidebar (1 col) */}
        <div className="space-y-3">
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900">
            <h3 className="text-xs font-black text-white uppercase mb-3 flex items-center justify-between">
              <span>All Episodes ({sortedEpisodes.length})</span>
              <span className="text-[10px] font-bold text-[#FF640A]">Ep {currentEpisode.episodeNumber} Playing</span>
            </h3>
            
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {sortedEpisodes.map((ep) => {
                const isActive = ep.episodeNumber === currentEpisodeNumber;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setCurrentEpisodeNumber(ep.episodeNumber);
                      setIsPlaying(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-[#FF640A] text-black shadow-lg scale-102 font-black'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 border border-zinc-850'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center font-black text-xs shrink-0">
                      {ep.episodeNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{ep.title}</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-black/80 font-bold' : 'text-zinc-500'}`}>
                        {ep.quality || '1080p Full HD'} • Dual Audio
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* VISUAL DOWNLOAD & EXTRACTION PROGRESS INDICATOR MODAL */}
      {/* ============================================================== */}
      {downloadProgressState.isExtracting && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#FF640A] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-[#FF640A] animate-spin" />
                <h3 className="text-sm font-black uppercase text-white">
                  मीडिया एक्सट्रैक्शन व डाउनलोड
                </h3>
              </div>
              <span className="text-xs font-black text-[#FF640A]">
                {downloadProgressState.progress}%
              </span>
            </div>

            <p className="text-xs font-bold text-zinc-300">
              {downloadProgressState.episodeTitle}
            </p>

            <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
              <div 
                className="h-full bg-gradient-to-r from-orange-600 via-[#FF640A] to-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgressState.progress}%` }}
              />
            </div>

            <p className="text-[11px] text-zinc-400 leading-tight">
              {downloadProgressState.stepText}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* KEYBOARD SHORTCUTS MODAL */}
      {/* ============================================================== */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#FF640A]" />
                <h3 className="text-xs font-black uppercase text-white">कीबोर्ड शॉर्टकट्स</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-xs text-zinc-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { k: 'Space / K', desc: 'प्ले / पॉज (Play / Pause)' },
                { k: 'F', desc: 'फुल स्क्रीन (Fullscreen)' },
                { k: 'M', desc: 'म्यूट / अनम्यूट (Mute / Unmute)' },
                { k: 'Left Arrow / J', desc: '10 सेकंड पीछे (Seek -10s)' },
                { k: 'Right Arrow / L', desc: '10 सेकंड आगे (Seek +10s)' },
                { k: 'Up / Down Arrow', desc: 'आवाज़ कम / ज़्यादा (Volume)' },
                { k: 'C', desc: 'सबटाइटल चालू / बंद (Toggle CC)' },
                { k: 'T', desc: 'थियेटर मोड (Theater Mode)' },
              ].map(({ k, desc }) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-[#FF640A]">
                    {k}
                  </span>
                  <span className="text-zinc-300 text-[11px]">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
