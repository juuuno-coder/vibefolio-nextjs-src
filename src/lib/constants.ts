/**
 * Centralized Constants for Vibefolio
 */

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vibefolio.net';

export const CATEGORY_IDS = {
  PHOTO: 1,
  ANIMATION: 2,
  GRAPHIC: 3,
  DESIGN: 4,
  VIDEO: 5,
  CINEMA: 6,
  AUDIO: 7,
  "3D": 8,
  TEXT: 9,
  CODE: 10,
  WEBAPP: 11,
  GAME: 12,
} as const;

export const GENRE_TO_CATEGORY_ID: Record<string, number> = {
  photo: 1,
  animation: 2,
  graphic: 3,
  design: 4,
  video: 5,
  cinema: 6,
  audio: 7,
  "3d": 8,
  text: 9,
  code: 10,
  webapp: 11,
  game: 12,
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
  { id: "marketing", label: "마케팅" },
  { id: "art", label: "문화/예술" },
  { id: "other", label: "기타" },
];
