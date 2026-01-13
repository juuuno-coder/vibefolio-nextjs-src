
import { 
  faCamera,
  faWandMagicSparkles,
  faPalette,
  faPenRuler,
  faVideo,
  faFilm,
  faHeadphones,
  faCube,
  faFileLines,
  faCode,
  faMobileScreen,
  faGamepad,
} from "@fortawesome/free-solid-svg-icons";
import { GENRE_CATEGORIES as GENRES_CONST, FIELD_CATEGORIES as FIELDS_CONST } from "@/lib/constants";

// 아이콘 매핑
const GENRE_ICONS: Record<string, any> = {
  photo: faCamera,
  animation: faWandMagicSparkles,
  graphic: faPalette,
  design: faPenRuler,
  video: faVideo,
  cinema: faFilm,
  audio: faHeadphones,
  "3d": faCube,
  text: faFileLines,
  code: faCode,
  webapp: faMobileScreen,
  game: faGamepad,
};

// 장르 카테고리 (Constants + Icons)
export const GENRE_CATEGORIES_WITH_ICONS = GENRES_CONST.map(g => ({
  ...g,
  value: g.id, 
  icon: GENRE_ICONS[g.id] || faCube
}));

// 산업 분야 카테고리
export const FIELD_CATEGORIES_WITH_ICONS = FIELDS_CONST.map(f => ({
  ...f,
  value: f.id 
}));
