/**
 * Centralized Constants for Vibefolio
 */

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vibefolio.net';

export const CATEGORY_IDS = {
  ALL: 1,
  AI: 2,
  VIDEO: 3,
  GRAPHIC: 4,
  CODING: 5, // VibeCoding
  ILLUST: 6,
  "3D": 7,
  PHOTO: 8,
  BRANDING: 9, // Branding/Editorial
  UIUX: 10,
  CHARACTER: 11,
  PRODUCT: 12, // Product/Package
  PHOTOGRAPHY: 13,
  TYPOGRAPHY: 14,
  CRAFT: 15,
  FINEART: 16,
} as const;

export const GENRE_TO_CATEGORY_ID: Record<string, number> = {
  photo: 8,
  animation: 3, // Video
  graphic: 4,
  design: 4, // Graphic
  video: 3,
  cinema: 3, // Video
  audio: 3, // Video
  "3d": 7,
  text: 9, // Branding/Editorial
  code: 5, // VibeCoding
  webapp: 5, // VibeCoding
  game: 3, // Video
  brand: 9, // Branding/Editorial
  illust: 6,
  ui: 10, // UI/UX
  product: 12, // Product/Package
  typo: 14, // Typography
  craft: 15,
  art: 16, // Fine Art
  ai: 2,
};

export const CONTACT_EMAIL = 'support@vibefolio.com';
export const SOCIAL_LINKS = {
  INSTAGRAM: 'https://instagram.com/vibefolio',
  FACEBOOK: 'https://facebook.com/vibefolio',
  THREADS: 'https://www.threads.net/@vibefolio',
  YOUTUBE: 'https://youtube.com/vibefolio',
};

export const GENRE_CATEGORIES = [
  { id: "photo", label: "포토" },
  { id: "animation", label: "웹툰/애니" },
  { id: "graphic", label: "그래픽" },
  { id: "design", label: "디자인" },
  { id: "video", label: "영상" },
  { id: "cinema", label: "영화·드라마" },
  { id: "audio", label: "오디오" },
  { id: "3d", label: "3D" },
  { id: "text", label: "텍스트" },
  { id: "code", label: "코드" },
  { id: "webapp", label: "웹/앱" },
  { id: "game", label: "게임" },
];

export const FIELD_CATEGORIES = [
  { id: "finance", label: "경제/금융" },
  { id: "healthcare", label: "헬스케어" },
  { id: "beauty", label: "뷰티/패션" },
  { id: "pet", label: "반려" },
  { id: "fnb", label: "F&B" },
  { id: "travel", label: "여행/레저" },
  { id: "education", label: "교육" },
  { id: "it", label: "IT" },
  { id: "lifestyle", label: "라이프스타일" },
  { id: "business", label: "비즈니스" },
  { id: "other", label: "기타" },
];
