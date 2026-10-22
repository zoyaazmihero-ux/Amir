export type AnimeGenre = 
  | 'Action' 
  | 'Adventure' 
  | 'Comedy'
  | 'Cyberpunk' 
  | 'Drama'
  | 'Fantasy' 
  | 'Isekai' 
  | 'Mecha' 
  | 'Music'
  | 'Mystery' 
  | 'Romance' 
  | 'Sci-Fi' 
  | 'Shonen' 
  | 'Slice of Life' 
  | 'Sports'
  | 'Supernatural' 
  | 'Thriller';

export type AnimeStatus = 'Ongoing' | 'Completed' | 'Upcoming';
export type AnimeType = 'TV Series' | 'Movie' | 'OVA' | 'Special';
export type WatchStatus = 'Watching' | 'Plan to Watch' | 'Completed' | 'Favorite';

export type MainTab = 'home' | 'lists' | 'browse' | 'simulcasts' | 'account';

export interface MediaAudioTrack {
  id: string;
  index: number;
  language: string;
  label: string;
  codec?: string;
  isDefault?: boolean;
  audioUrl?: string;
  videoUrl?: string;
}

export interface MediaSubtitleTrack {
  id: string;
  index: number;
  language: string;
  label: string;
  codec?: string;
  isDefault?: boolean;
  subUrl?: string;
}

export interface Episode {
  id: string;
  animeId: string;
  episodeNumber: number;
  title: string;
  synopsis?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  introStart?: number;
  introEnd?: number;
  outroStart?: number;
  outroEnd?: number;
  isSubbed: boolean;
  isDubbed: boolean;
  uploadedAt: string;
  viewsCount: number;
  quality?: string;
  language?: string;
  partRange?: string;
  seasonName?: string;
  audioTracks?: MediaAudioTrack[];
  subtitleTracks?: MediaSubtitleTrack[];
}

export interface Anime {
  id: string;
  title: string;
  japaneseTitle?: string;
  synopsis: string;
  coverImage: string;
  bannerImage: string;
  genres: AnimeGenre[];
  releaseYear: number;
  season?: string; // e.g. "Summer 2026", "Spring 2026"
  status: AnimeStatus;
  type: AnimeType;
  studio: string;
  rating: number; // 0.0 - 5.0
  ratingCount?: string; // e.g. "457K"
  contentRating?: string; // e.g. "U/A 16+"
  totalEpisodes: number;
  isTrending?: boolean;
  isFeatured?: boolean;
  featuredTagline?: string;
  views: number;
  isDubbedHindi?: boolean;
}

export interface Comment {
  id: string;
  episodeId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestampTag?: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

export interface WatchProgress {
  animeId: string;
  episodeId: string;
  episodeNumber: number;
  progressSeconds: number;
  durationSeconds: number;
  lastWatchedAt: string;
}

export interface WatchlistItem {
  animeId: string;
  status: WatchStatus;
  addedAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  selectedGenre: string;
  selectedStatus: string;
  selectedType: string;
  sortBy: 'popular' | 'rating' | 'newest' | 'title';
}

export interface OfflineEpisode {
  episodeId: string;
  animeId: string;
  animeTitle: string;
  episodeNumber: number;
  title: string;
  synopsis?: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  quality?: string;
  language?: string;
  seasonName?: string;
  partRange?: string;
  markedOfflineAt: string;
  isAvailableOffline: boolean;
  estimatedSizeBytes?: number;
}

