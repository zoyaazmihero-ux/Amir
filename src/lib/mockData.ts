import { Anime, Episode } from '../types';
import { ANIME_LIST_PART_1 } from './animeData1';
import { ANIME_LIST_PART_2 } from './animeData2';
import { ANIME_LIST_PART_3 } from './animeData3';
import { EPISODES_PART_1 } from './episodesData1';
import { EPISODES_PART_2 } from './episodesData2';
import { EPISODES_PART_3 } from './episodesData3';
import { EPISODES_PART_4 } from './episodesData4';
import { KOREAN_AND_MOVIES_LIST, KOREAN_AND_MOVIES_EPISODES } from './koreanAndMoviesData';

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

export const INITIAL_ANIME_LIST: Anime[] = deduplicateById([
  ...KOREAN_AND_MOVIES_LIST,
  ...ANIME_LIST_PART_1,
  ...ANIME_LIST_PART_2,
  ...ANIME_LIST_PART_3
]);

export const INITIAL_EPISODES: Episode[] = deduplicateById([
  ...KOREAN_AND_MOVIES_EPISODES,
  ...EPISODES_PART_1,
  ...EPISODES_PART_2,
  ...EPISODES_PART_3,
  ...EPISODES_PART_4
]);
