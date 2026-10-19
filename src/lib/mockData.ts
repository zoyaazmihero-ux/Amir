import { Anime, Episode } from '../types';
import { ANIME_LIST_PART_1 } from './animeData1';
import { ANIME_LIST_PART_2 } from './animeData2';
import { ANIME_LIST_PART_3 } from './animeData3';
import { EPISODES_PART_1 } from './episodesData1';
import { EPISODES_PART_2 } from './episodesData2';
import { EPISODES_PART_3 } from './episodesData3';
import { EPISODES_PART_4 } from './episodesData4';

export const INITIAL_ANIME_LIST: Anime[] = [
  ...ANIME_LIST_PART_1,
  ...ANIME_LIST_PART_2,
  ...ANIME_LIST_PART_3
];

export const INITIAL_EPISODES: Episode[] = [
  ...EPISODES_PART_1,
  ...EPISODES_PART_2,
  ...EPISODES_PART_3,
  ...EPISODES_PART_4
];
