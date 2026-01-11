-- 1. Team 5를 'Vibefolio (5조)'로 변경
UPDATE ir_decks
SET team_name = 'Vibefolio (5조)',
    title = 'Vibefolio IR Pitch Deck',
    description = '크리에이터를 위한 영감 저장소 및 커리어 성장 플랫폼'
WHERE team_name = 'Team 5';

-- 2. 기존 슬라이드 초기화 (Vibefolio 덱)
DELETE FROM ir_slides 
WHERE deck_id = (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)');

-- 3. Vibefolio 프로젝트 컨텍스트를 반영한 초안 슬라이드 생성
INSERT INTO ir_slides (deck_id, order_index, layout_type, title, content, speaker_notes)
VALUES
-- 0. Cover
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    0,
    'cover',
    'Vibefolio',
    '크리에이터를 위한 영감 저장소 & 커리어 플랫폼\n"Connect, Create, Career"',
    '안녕하십니까, 5조 발표자입니다. 저희는 크리에이터들이 영감을 얻고, 기회를 찾으며, 함께 성장하는 플랫폼 ‘Vibefolio’를 소개합니다.'
),
-- 1. Problem
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    1,
    'basic',
    'Problem: 흩어진 기회, 단절된 성장',
    '### 크리에이터들의 Pain Point\n\n1. **파편화된 정보**: 포트폴리오는 A사이트, 채용 공고는 B사이트, 공모전은 C사이트...\n2. **네트워킹의 부재**: 단순한 작업물 업로드 외에 실질적인 교류가 어려움.\n3. **관리의 어려움**: 자신의 작업물을 체계적으로 아카이빙하고 성과를 증명하기 복잡함.',
    '현재 크리에이터 시장의 가장 큰 문제는 정보와 기회가 파편화되어 있다는 점입니다. 디자이너와 개발자들은 자신의 생태계 안에서만 머물기 쉽습니다.'
),
-- 2. Solution
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    2,
    'image_right',
    'Solution: All-in-One Creator Platform',
    '### Vibefolio가 제시하는 해결책\n\n- **통합 아카이빙**: 프로젝트 업로드 및 관리의 간소화\n- **맞춤형 커리어**: AI 기반 채용/공모전 정보 큐레이션 (개발 중)\n- **관리자 중심 운영**: 강력한 Admin 기능을 통한 퀄리티 컨트롤',
    '바이브폴리오는 이 모든 것을 하나의 플랫폼에서 해결합니다. 포트폴리오 관리부터 취업 기회까지, 크리에이터의 라이프사이클을 함께합니다.'
),
-- 3. Market
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    3,
    'grid',
    'Market Opportunity',
    '### 급성장하는 크리에이터 이코노미\n\n- **TAM (Total Available Market)**: 글로벌 크리에이터 이코노미 시장 (1,000억 달러+)\n- **SAM (Serviceable Available Market)**: 국내 디자인/개발 프리랜서 및 구직자 시장\n- **SOM (Serviceable Obtainable Market)**: 초기 진입 대학생 및 주니어 크리에이터 10만 명',
    '전 세계적으로 크리에이터 이코노미는 폭발적으로 성장하고 있으며, 국내 시장 또한 전문화된 버티컬 플랫폼을 원하고 있습니다.'
),
-- 4. Product Highlight 1
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    4,
    'image_left',
    'Product: 영감을 주는 갤러리형 피드',
    '### 직관적인 UX/UI\n\n- 몰입감을 주는 Masonry 그리드 레이아웃\n- 마우스 호버 시 은은한 인터랙션 (Shine Effect)\n- 카테고리별 필터링 및 빠른 탐색',
    '사용자가 접속하자마자 시각적인 즐거움을 느낄 수 있도록, 갤러리 형태의 피드 UI를 구현했습니다. (최근 업데이트된 호버 효과 강조)'
),
-- 5. Product Highlight 2 (Admin)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    5,
    'basic',
    'Product: 강력한 어드민 & 데이터 분석',
    '### 데이터 기반 운영\n\n- **대시보드**: 일별 방문자, 가입자, 프로젝트 업로드 현황 한눈에 파악\n- **콘텐츠 관리**: 배너, 채용 공고, 팝업 등을 코딩 없이 관리자가 직접 제어\n- **로그 시스템**: 관리자 활동 로그 및 상세 방문 기록 추적',
    '서비스의 지속 가능성을 위해 백오피스 기능을 강화했습니다. 특히 방문자 통계와 로그 시스템을 통해 유저 데이터를 정밀하게 분석할 수 있습니다.'
),
-- 6. Business Model
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    6,
    'grid',
    'Business Model',
    '### 수익화 전략\n\n1. **프리미엄 채용 공고**: 기업 상단 노출 광고비\n2. **Pro 멤버십**: 포트폴리오 무제한 용량 및 통계 기능 제공 (구상)\n3. **매칭 수수료**: 프로젝트 의뢰 및 프리랜서 매칭 시 수수료',
    '초기에는 트래픽 확보에 집중하고, 이후 프리미엄 공고와 멤버십을 통해 수익화를 달성할 계획입니다.'
),
-- 7. Roadmap
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    7,
    'basic',
    'Growth Roadmap',
    '### 2026 실행 계획\n\n- **Q1**: 서비스 런칭 및 초기 유저(Seed User) 1,000명 확보\n- **Q2**: AI 기반 포트폴리오 분석 및 매칭 시스템 도입\n- **Q3**: 모바일 앱 출시 및 멤버십 모델 테스트',
    '3단계 마일스톤을 통해 체계적으로 성장하겠습니다.'
),
-- 8. Team
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    8,
    'grid',
    'Team Vibefolio',
    '### 5조 (The Dream Team)\n\n- **기획/PM**: 서비스 전체 방향성 설계\n- **Frontend**: Next.js 기반 반응형 웹 및 인터랙션 구현\n- **Backend**: Supabase DB 설계 및 API 최적화\n- **Design**: UI/UX 디자인 및 브랜딩',
    '저희는 기획부터 개발, 디자인까지 모든 역량을 갖춘 팀입니다.'
);
