import { Anime, Episode, WatchProgress, WatchlistItem, Comment, WatchStatus } from '../types';
import { INITIAL_ANIME_LIST, INITIAL_EPISODES } from './mockData';

const KEYS = {
  ANIME_LIST: 'aniverse_anime_list_v3',
  EPISODES_LIST: 'aniverse_episodes_list_v3',
  WATCH_PROGRESS: 'aniverse_watch_progress_v1',
  WATCHLIST: 'aniverse_watchlist_v1',
  COMMENTS: 'aniverse_comments_v1',
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
    const existingIds = new Set(parsed.map(a => a.id));
    const missing = INITIAL_ANIME_LIST.filter(a => !existingIds.has(a.id));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      localStorage.setItem(KEYS.ANIME_LIST, JSON.stringify(merged));
      return merged;
    }
    return parsed;
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
  const updated = [newAnime, ...current];
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
    const existingIds = new Set(parsed.map(e => e.id));
    const missing = INITIAL_EPISODES.filter(e => !existingIds.has(e.id));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      localStorage.setItem(KEYS.EPISODES_LIST, JSON.stringify(merged));
      return merged;
    }
    return parsed;
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
