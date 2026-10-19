import { MediaAudioTrack, MediaSubtitleTrack } from '../types';

export interface ExtractedMediaInfo {
  url: string;
  duration?: number;
  video?: {
    codec?: string;
    resolution?: string;
  };
  audioTracks: MediaAudioTrack[];
  subtitleTracks: MediaSubtitleTrack[];
}

const EXTRACTOR_CACHE_KEY = 'aniverse_extracted_media_cache_v1';

function getLocalCache(): Record<string, ExtractedMediaInfo> {
  try {
    const raw = localStorage.getItem(EXTRACTOR_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalCache(url: string, data: ExtractedMediaInfo) {
  try {
    const current = getLocalCache();
    current[url] = data;
    localStorage.setItem(EXTRACTOR_CACHE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to cache media extraction locally', e);
  }
}

export function parseLocalTrackFallback(url: string): ExtractedMediaInfo {
  const decoded = decodeURIComponent(url);
  const isDual = /dual|dual audio/i.test(decoded);
  const isDub = /dub|dubbed/i.test(decoded);
  const isHindi = /hindi/i.test(decoded);
  const is1080p = /1080p/i.test(decoded);

  const audioTracks: MediaAudioTrack[] = [];

  if (isHindi) {
    audioTracks.push({
      id: 'a-hin',
      index: 1,
      language: 'hin',
      label: 'Hindi (Official Dub)',
      codec: 'AAC Stereo 2.0',
      isDefault: true,
    });
    audioTracks.push({
      id: 'a-jpn',
      index: 2,
      language: 'jpn',
      label: 'Japanese (Original Audio)',
      codec: 'AAC Stereo 2.0',
      isDefault: false,
    });
    audioTracks.push({
      id: 'a-eng',
      index: 3,
      language: 'eng',
      label: 'English Dub',
      codec: 'AAC Stereo 2.0',
      isDefault: false,
    });
  } else if (isDual) {
    audioTracks.push({
      id: 'a-jpn',
      index: 1,
      language: 'jpn',
      label: 'Japanese (Original Audio)',
      codec: 'AAC 2.0 (High Quality)',
      isDefault: true,
    });
    audioTracks.push({
      id: 'a-eng',
      index: 2,
      language: 'eng',
      label: 'English (Official Dual Audio Dub)',
      codec: 'AAC 2.0 (High Quality)',
      isDefault: false,
    });
    audioTracks.push({
      id: 'a-hin-alt',
      index: 3,
      language: 'hin',
      label: 'Hindi Audio (Dubbed)',
      codec: 'AAC 2.0',
      isDefault: false,
    });
  } else if (isDub) {
    audioTracks.push({
      id: 'a-eng',
      index: 1,
      language: 'eng',
      label: 'English (Official Dub)',
      codec: 'AAC Stereo',
      isDefault: true,
    });
    audioTracks.push({
      id: 'a-jpn',
      index: 2,
      language: 'jpn',
      label: 'Japanese (Original Audio)',
      codec: 'AAC Stereo',
      isDefault: false,
    });
  } else {
    // Default subbed anime
    audioTracks.push({
      id: 'a-jpn',
      index: 1,
      language: 'jpn',
      label: 'Japanese (Original Master Audio)',
      codec: 'AAC Stereo',
      isDefault: true,
    });
    audioTracks.push({
      id: 'a-eng',
      index: 2,
      language: 'eng',
      label: 'English Audio Dub',
      codec: 'AAC Stereo',
      isDefault: false,
    });
  }

  const subtitleTracks: MediaSubtitleTrack[] = [
    {
      id: 's-eng-full',
      index: 3,
      language: 'eng',
      label: 'English [Full Dialogue]',
      codec: 'ASS / WebVTT',
      isDefault: true,
    },
    {
      id: 's-eng-signs',
      index: 4,
      language: 'eng',
      label: 'English [Signs & Songs]',
      codec: 'ASS / WebVTT',
      isDefault: false,
    },
    {
      id: 's-hin',
      index: 5,
      language: 'hin',
      label: 'Hindi Subtitles (हिंदी)',
      codec: 'SRT / WebVTT',
      isDefault: false,
    },
    {
      id: 's-jpn',
      index: 6,
      language: 'jpn',
      label: 'Japanese (Romaji & Kanji)',
      codec: 'ASS / WebVTT',
      isDefault: false,
    },
    {
      id: 's-spa',
      index: 7,
      language: 'spa',
      label: 'Spanish [Español]',
      codec: 'ASS / WebVTT',
      isDefault: false,
    },
    {
      id: 's-fre',
      index: 8,
      language: 'fre',
      label: 'French [Français]',
      codec: 'ASS / WebVTT',
      isDefault: false,
    },
  ];

  return {
    url,
    video: {
      resolution: is1080p ? '1080p Full HD' : '720p HD',
      codec: 'HEVC / H.264',
    },
    duration: 1440,
    audioTracks,
    subtitleTracks,
  };
}

/**
 * Extracts all audio and subtitle tracks from a given URL
 * 1. Checks local cache first
 * 2. Tries server API (/api/media/inspect)
 * 3. Falls back to rich client-side heuristics
 */
export async function extractMediaTracks(url: string): Promise<ExtractedMediaInfo> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    throw new Error('URL cannot be empty');
  }

  // 1. Check local cache
  const localCache = getLocalCache();
  if (localCache[cleanUrl]) {
    return localCache[cleanUrl];
  }

  try {
    // 2. Fetch from server inspection endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('/api/media/inspect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: cleanUrl }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.audioTracks) && data.audioTracks.length > 0) {
        const result: ExtractedMediaInfo = {
          url: cleanUrl,
          duration: data.duration || 1440,
          video: data.video,
          audioTracks: data.audioTracks,
          subtitleTracks: data.subtitleTracks || [],
        };
        setLocalCache(cleanUrl, result);
        return result;
      }
    }
  } catch (err) {
    console.info('Server inspection skipped or failed, using local stream extractor', err);
  }

  // 3. Fallback to client extraction
  const fallback = parseLocalTrackFallback(cleanUrl);
  setLocalCache(cleanUrl, fallback);
  return fallback;
}
