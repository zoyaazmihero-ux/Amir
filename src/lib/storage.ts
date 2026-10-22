import { Anime, Episode, WatchProgress, WatchlistItem, Comment, WatchStatus, OfflineEpisode } from '../types';
import { INITIAL_ANIME_LIST, INITIAL_EPISODES } from './mockData';

const KEYS = {
  ANIME_LIST: 'aniverse_anime_list_v6',
  EPISODES_LIST: 'aniverse_episodes_list_v6',
  WATCH_PROGRESS: 'aniverse_watch_progress_v1',
  WATCHLIST: 'aniverse_watchlist_v1',
  COMMENTS: 'aniverse_comments_v1',
  OFFLINE_EPISODES: 'aniverse_offline_episodes_v1',
};

// LocalStorage Helper functions
export function getStoredAnimeList(): Anime[] {
  try {
    const raw = localStorage.getItem(KEYS.ANIME_LIST);
    if (!raw) {
      localStorage.setItem(KEYS.ANIME_LIST, JSON.stringify(INITIAL_ANIME_LIST));
      return INITIAL_ANIME_LIST;
    }
    const parsed: Anime[] = JSON.parse(raw);
    
    // Deduplicate parsed array
    const seen = new Set<string>();
    const deduplicatedParsed: Anime[] = [];
    for (const a of parsed) {
      if (a && a.id && !seen.has(a.id)) {
        seen.add(a.id);
        deduplicatedParsed.push(a);
      }
    }

    const missing = INITIAL_ANIME_LIST.filter(a => !seen.has(a.id));
    if (missing.length > 0) {
      const merged = [...deduplicatedParsed, ...missing];
      localStorage.setItem(KEYS.ANIME_LIST, JSON.stringify(merged));
      return merged;
    }
    return deduplicatedParsed;
  } catch (err) {
    console.error('Error loading anime list:', err);
    return INITIAL_ANIME_LIST;
  }
}

export function saveAnimeList(list: Anime[]): void {
  try {
    localStorage.setItem(KEYS.ANIME_LIST, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving anime list:', err);
  }
}

export function addAnimeSeries(newAnime: Anime): Anime[] {
  const current = getStoredAnimeList();
  const updated = [newAnime, ...current.filter(a => a.id !== newAnime.id)];
  saveAnimeList(updated);
  return updated;
}

export function getStoredEpisodes(): Episode[] {
  try {
    const raw = localStorage.getItem(KEYS.EPISODES_LIST);
    if (!raw) {
      localStorage.setItem(KEYS.EPISODES_LIST, JSON.stringify(INITIAL_EPISODES));
      return INITIAL_EPISODES;
    }
    const parsed: Episode[] = JSON.parse(raw);

    // Deduplicate parsed episodes
    const seen = new Set<string>();
    const deduplicatedEpisodes: Episode[] = [];
    for (const e of parsed) {
      if (e && e.id && !seen.has(e.id)) {
        seen.add(e.id);
        deduplicatedEpisodes.push(e);
      }
    }

    const missing = INITIAL_EPISODES.filter(e => !seen.has(e.id));
    if (missing.length > 0) {
      const merged = [...deduplicatedEpisodes, ...missing];
      localStorage.setItem(KEYS.EPISODES_LIST, JSON.stringify(merged));
      return merged;
    }
    return deduplicatedEpisodes;
  } catch (err) {
    console.error('Error loading episodes list:', err);
    return INITIAL_EPISODES;
  }
}

export function saveEpisodes(episodes: Episode[]): void {
  try {
    localStorage.setItem(KEYS.EPISODES_LIST, JSON.stringify(episodes));
  } catch (err) {
    console.error('Error saving episodes:', err);
  }
}

export function addEpisode(newEpisode: Episode): Episode[] {
  const current = getStoredEpisodes();
  const updated = [newEpisode, ...current];
  saveEpisodes(updated);
  return updated;
}

export function getWatchProgress(): WatchProgress[] {
  try {
    const raw = localStorage.getItem(KEYS.WATCH_PROGRESS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchProgress(progress: WatchProgress): void {
  try {
    const current = getWatchProgress();
    const existingIdx = current.findIndex(p => p.animeId === progress.animeId && p.episodeId === progress.episodeId);
    if (existingIdx >= 0) {
      current[existingIdx] = progress;
    } else {
      current.unshift(progress);
    }
    localStorage.setItem(KEYS.WATCH_PROGRESS, JSON.stringify(current));
  } catch (err) {
    console.error('Error saving watch progress:', err);
  }
}

export function getWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(KEYS.WATCHLIST);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleWatchlist(animeId: string, status: WatchStatus = 'Watching'): WatchlistItem[] {
  const current = getWatchlist();
  const existingIdx = current.findIndex(i => i.animeId === animeId);
  if (existingIdx >= 0) {
    if (current[existingIdx].status === status) {
      current.splice(existingIdx, 1);
    } else {
      current[existingIdx].status = status;
      current[existingIdx].addedAt = new Date().toISOString();
    }
  } else {
    current.unshift({
      animeId,
      status,
      addedAt: new Date().toISOString()
    });
  }
  localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(current));
  return current;
}

export function getComments(episodeId: string): Comment[] {
  try {
    const raw = localStorage.getItem(KEYS.COMMENTS);
    const allComments: Comment[] = raw ? JSON.parse(raw) : getInitialComments();
    return allComments.filter(c => c.episodeId === episodeId);
  } catch {
    return [];
  }
}

export function addComment(episodeId: string, userName: string, text: string, timestampTag?: string): Comment {
  const raw = localStorage.getItem(KEYS.COMMENTS);
  const allComments: Comment[] = raw ? JSON.parse(raw) : getInitialComments();
  
  const newComment: Comment = {
    id: 'comment-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    episodeId,
    userName: userName.trim() || 'Otaku' + Math.floor(1000 + Math.random() * 9000),
    userAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName || 'Otaku')}`,
    text,
    timestampTag,
    createdAt: new Date().toISOString(),
    likes: 0
  };

  allComments.unshift(newComment);
  localStorage.setItem(KEYS.COMMENTS, JSON.stringify(allComments));
  return newComment;
}

export function toggleCommentLike(commentId: string): Comment[] {
  const raw = localStorage.getItem(KEYS.COMMENTS);
  const allComments: Comment[] = raw ? JSON.parse(raw) : getInitialComments();
  const comment = allComments.find(c => c.id === commentId);
  if (comment) {
    if (comment.isLiked) {
      comment.likes = Math.max(0, comment.likes - 1);
      comment.isLiked = false;
    } else {
      comment.likes += 1;
      comment.isLiked = true;
    }
    localStorage.setItem(KEYS.COMMENTS, JSON.stringify(allComments));
  }
  return allComments;
}

export async function storeUploadedVideoFile(id: string, file: File): Promise<string> {
  return URL.createObjectURL(file);
}

function getInitialComments(): Comment[] {
  return [
    {
      id: 'c-1',
      episodeId: 'bt-1',
      userName: 'ShinobiMaster',
      userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shinobi',
      text: 'The battle animation in Black Torch Episode 1 is so clean!',
      timestampTag: '02:15',
      createdAt: '2026-02-02T14:20:00Z',
      likes: 42,
      isLiked: false
    }
  ];
}

// ==========================================
// OFFLINE EPISODES CACHING MECHANISM
// ==========================================

export const OFFLINE_CHANGE_EVENT = 'aniverse_offline_changed';

function dispatchOfflineChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_CHANGE_EVENT));
  }
}

export function getOfflineEpisodes(): OfflineEpisode[] {
  try {
    const raw = localStorage.getItem(KEYS.OFFLINE_EPISODES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading offline episodes from localStorage:', e);
    return [];
  }
}

export function isEpisodeAvailableOffline(episodeId: string): boolean {
  if (!episodeId) return false;
  const list = getOfflineEpisodes();
  return list.some(item => item.episodeId === episodeId && item.isAvailableOffline);
}

export function toggleEpisodeOffline(episode: Episode, anime: Anime): { isOffline: boolean; item: OfflineEpisode | null } {
  try {
    const list = getOfflineEpisodes();
    const existingIndex = list.findIndex(item => item.episodeId === episode.id);

    if (existingIndex >= 0) {
      // Remove from offline
      list.splice(existingIndex, 1);
      localStorage.setItem(KEYS.OFFLINE_EPISODES, JSON.stringify(list));
      dispatchOfflineChange();
      return { isOffline: false, item: null };
    } else {
      // Calculate realistic file size estimate: ~300-450MB based on duration & 1080p
      const durationMins = (episode.duration || 1440) / 60;
      const estimatedBytes = Math.round(durationMins * 18 * 1024 * 1024); // ~18MB per minute for 1080p

      const newItem: OfflineEpisode = {
        episodeId: episode.id,
        animeId: anime.id,
        animeTitle: anime.title,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        synopsis: episode.synopsis,
        thumbnailUrl: episode.thumbnailUrl || anime.coverImage,
        videoUrl: episode.videoUrl,
        duration: episode.duration || 1440,
        quality: episode.quality || '1080P Full HD',
        language: episode.language || 'Sub / Dual Audio',
        seasonName: episode.seasonName || 'Season 1',
        partRange: episode.partRange,
        markedOfflineAt: new Date().toISOString(),
        isAvailableOffline: true,
        estimatedSizeBytes: estimatedBytes,
      };

      list.unshift(newItem);
      localStorage.setItem(KEYS.OFFLINE_EPISODES, JSON.stringify(list));
      dispatchOfflineChange();
      return { isOffline: true, item: newItem };
    }
  } catch (err) {
    console.error('Error toggling offline status:', err);
    return { isOffline: false, item: null };
  }
}

export function removeOfflineEpisode(episodeId: string): void {
  try {
    const list = getOfflineEpisodes();
    const updated = list.filter(item => item.episodeId !== episodeId);
    localStorage.setItem(KEYS.OFFLINE_EPISODES, JSON.stringify(updated));
    dispatchOfflineChange();
  } catch (err) {
    console.error('Error removing offline episode:', err);
  }
}

export function clearAllOfflineEpisodes(): void {
  try {
    localStorage.removeItem(KEYS.OFFLINE_EPISODES);
    dispatchOfflineChange();
  } catch (err) {
    console.error('Error clearing offline episodes:', err);
  }
}

export function getOfflineStorageEstimate(): { totalCount: number; formattedSize: string; totalBytes: number } {
  const list = getOfflineEpisodes();
  const totalBytes = list.reduce((acc, curr) => acc + (curr.estimatedSizeBytes || 350 * 1024 * 1024), 0);
  
  if (totalBytes === 0) {
    return { totalCount: 0, formattedSize: '0 MB', totalBytes: 0 };
  }
  if (totalBytes > 1024 * 1024 * 1024) {
    return {
      totalCount: list.length,
      formattedSize: `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`,
      totalBytes
    };
  }
  return {
    totalCount: list.length,
    formattedSize: `${Math.round(totalBytes / (1024 * 1024))} MB`,
    totalBytes
  };
}

