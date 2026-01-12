/**
 * Centralized Constants for Vibefolio
 */

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vibefolio.net';

export const CATEGORY_IDS = {
  ALL: 1,
  AI: 2,
  VIDEO: 3,
  GRAPHIC_DESIGN: 4,
  WEB_DESIGN: 5,
  ILLUST: 6,
  "3D": 7,
  PHOTO: 8,
  BRAND: 5, // Mapping legacy or alternate names to current IDs
  UI: 9,
  PRODUCT: 10,
  TYPO: 11,
  CRAFT: 12,
  ART: 13,
} as const;

export const GENRE_TO_CATEGORY_ID: Record<string, number> = {
  photo: 8,
  animation: 3,
  graphic: 4,
  design: 4,
  video: 3,
  cinema: 3,
  audio: 7, // Placeholder for audio if not in DB
  "3d": 7,
  text: 1,
  code: 1,
  webapp: 5,
  game: 3,
  brand: 5,
  illust: 6,
  ui: 9,
  product: 10,
  typo: 11,
  craft: 12,
  art: 13,
  ai: 2,
};

export const CONTACT_EMAIL = 'support@vibefolio.com';
export const SOCIAL_LINKS = {
  INSTAGRAM: 'https://instagram.com/vibefolio',
  FACEBOOK: 'https://facebook.com/vibefolio',
  THREADS: 'https://www.threads.net/@vibefolio',
  YOUTUBE: 'https://youtube.com/vibefolio',
};
