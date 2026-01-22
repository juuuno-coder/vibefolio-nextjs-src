// 카테고리 매핑 - StickyMenu value와 DB name 연결
export const CATEGORY_MAP: Record<string, string> = {
  // 기존 카테고리
  "korea": "전체",
  "all": "전체",
  "video": "영상",
  "graphic-design": "그래픽 디자인",
  "brand": "브랜딩/편집",
  "ui": "UI/UX",
  "web-design": "웹 디자인",
  "illustration": "일러스트레이션",
  "illust": "일러스트",
  "digital-art": "디지털 아트",
  "ai": "AI",
  "3d": "3D",
  "cartoon": "캐릭터 디자인",
  "product-design": "제품/패키지 디자인",
  "photography": "포토그래피",
  "photo": "포토",
  "typography": "타이포그래피",
  "craft": "공예",
  // "art": "파인아트", // Moved to field category
  
  // 새로운 장르 카테고리
  "animation": "웹툰/애니",
  "graphic": "그래픽",
  "design": "디자인",
  "cinema": "영화·드라마",
  "audio": "오디오",
  "text": "텍스트",
  "code": "코드",
  "webapp": "웹/앱",
  "game": "게임",
  
  // 산업 분야 카테고리
  "finance": "경제/금융",
  "healthcare": "헬스케어",
  "beauty": "뷰티/패션",
  "pet": "반려",
  "fnb": "F&B",
  "travel": "여행/레저",
  "education": "교육",
  "it": "IT",
  "lifestyle": "라이프스타일",
  "business": "비즈니스",
  "marketing": "마케팅",
  "art": "문화/예술",
  "other": "기타",
};

// 역매핑 - DB name에서 value로
export const CATEGORY_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_MAP).map(([key, value]) => [value, key])
);

// value를 DB name으로 변환
export function getCategoryName(value: string): string {
  return CATEGORY_MAP[value] || "전체";
}

// DB name을 value로 변환
export function getCategoryValue(name: string): string {
  return CATEGORY_REVERSE_MAP[name] || "all";
}

// 카테고리 ID를 이름으로 변환 (DB에서 숫자로 저장된 경우)
export function getCategoryNameById(id: number | string): string {
  const idMap: Record<number, string> = {
    1: "포토",
    2: "웹툰/애니", 
    3: "그래픽",
    4: "디자인",
    5: "영상",
    6: "영화·드라마",
    7: "오디오",
    8: "3D",
    9: "텍스트",
    10: "코드",
    11: "웹/앱",
    12: "게임",
  };
  
  const numId = typeof id === 'string' ? parseInt(id) : id;
  return idMap[numId] || "전체";
}

// 관심 장르에 해당하는 프로젝트 필터링
export function filterByInterests(
  projects: any[],
  genres: string[],
  fields: string[]
): any[] {
  if (genres.length === 0 && fields.length === 0) {
    return projects;
  }
  
  const genreNames = genres.map(g => getCategoryName(g));
  const fieldNames = fields.map(f => getCategoryName(f));
  
  return projects.filter(p => {
    const matchGenre = genreNames.length === 0 || genreNames.includes(p.category);
    // 분야는 별도 필드가 있다면 체크, 없으면 장르만 체크
    return matchGenre;
  });
}

// UI에서 사용할 장르 카테고리 리스트
export const genreCategories = [
  { id: "video", label: "영상", icon: "faVideo" }, // 실제 아이콘은 컴포넌트에서 매핑
  { id: "graphic", label: "그래픽", icon: "faImage" },
  { id: "design", label: "디자인", icon: "faPenNib" },
  { id: "animation", label: "웹툰/애니", icon: "faFilm" },
  { id: "cinema", label: "영화·드라마", icon: "faClapperboard" },
  { id: "audio", label: "오디오", icon: "faMusic" },
  { id: "text", label: "텍스트", icon: "faQuoteLeft" },
  { id: "code", label: "코드", icon: "faCode" },
  { id: "webapp", label: "웹/앱", icon: "faMobileScreen" },
  { id: "game", label: "게임", icon: "faGamepad" },
];

export const fieldCategories = [
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
];
