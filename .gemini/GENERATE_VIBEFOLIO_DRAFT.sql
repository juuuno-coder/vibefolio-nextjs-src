-- 1. Team 5를 'Vibefolio (5조)'로 변경하고 IR Deck 정보 업데이트
UPDATE ir_decks
SET team_name = 'Vibefolio (5조)',
    title = 'Vibefolio - AI 창작자들을 위한 실체 있는 놀이터',
    description = '바이브코더(AI Creator)를 위한 포트폴리오 아카이빙 및 올인원 커뮤니티 (MVP 구현 완료)'
WHERE team_name = 'Vibefolio (5조)';

-- 2. 기존 슬라이드 초기화 (Vibefolio 덱)
DELETE FROM ir_slides 
WHERE deck_id = (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)');

-- 3. 코드베이스 분석 기반 상세 IR 슬라이드 생성 (Implemented Version)
INSERT INTO ir_slides (deck_id, order_index, layout_type, title, content, speaker_notes)
VALUES
-- 0. Cover
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    0,
    'cover',
    'Vibefolio',
    'AI 활용 창작자, "바이브코더"를 위한\n단 하나의 포트폴리오 플랫폼\n(MVP Developed & Live)',
    '안녕하십니까, 5조 발표자입니다. 저희는 아이디어가 아닌, 실제로 동작하는 플랫폼 Vibefolio를 보여드리기 위해 이 자리에 섰습니다.'
),
-- 1. Project Question (Why We Started)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    1,
    'big_number',
    'Project Question',
    '### "우리에게 가장 필요한 플랫폼은 무엇일까?"\n\n1. 각자의 프로젝트를 효과적으로 홍보할 수 있는 곳\n2. MVP로 빠르게 유저를 모으고 반응을 확인할 수 있는 곳\n3. **바이브코딩**으로 만든 결과물을 인정받을 수 있는 곳',
    '이 프로젝트는 저희 팀 스크로가 직접 겪은 갈증에서 시작되었습니다. "우리가 만든 AI 결과물을 어디에 자랑하지?" 이 질문이 Vibefolio의 시작이었습니다.'
),
-- 2. Market Problem (Pain Points)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    2,
    'swot',
    'Why New Platform?',
    '### 기존 플랫폼(Behance, Notefolio)의 페인 포인트\n\n- **AI에 대한 시선**: 순수 예술가나 기존 창작자들은 AI 창작물을 "쉽게 만든 것"으로 간주하거나 좋지 않게 보는 경향이 있음.\n- **평가의 모호함**: AI 비중이 높으면 실력을 인정받기 어렵고, 커뮤니티 내에서 소외됨.\n- **정보의 부재**: 어떤 모델, 어떤 프롬프트를 썼는지 기술적인 정보 공유가 활발하지 않음.',
    '기존 플랫폼에서 AI 창작자들은 이방인 취급을 받습니다. 프롬프트 공유 문화도 없죠. 우리는 이들을 위한 전용 무대가 필요하다고 확신했습니다.'
),
-- 3. Solution (Archive - Implemented)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    3,
    'image_left',
    'Solution 1: Archive (구현 완료)',
    '### 직관적인 Masonry Grid & 아카이빙\n\n- **Discover**: 최신 트렌드를 한눈에 볼 수 있는 핀터레스트 스타일의 Masonry Layout 적용 (Mobile Responsive)\n- **Detail**: 단순 이미지가 아닌, 기획 의도와 사용 툴(Prompt info)을 상세히 기록하는 에디터 구현\n- **Search**: 카테고리, 분야, 태그 기반의 실시간 검색 엔진 탑재',
    '지금 보시는 화면은 디자인 시안이 아닙니다. 실제 구현된 Vibefolio의 메인 화면입니다. 반응형 그리드와 강력한 검색 기능이 이미 작동하고 있습니다.'
),
-- 4. Solution (AI Tech - Implemented)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    4,
    'image_right',
    'Solution 2: AI Tech (구현 완료)',
    '### URL 하나로 공고 분석 (AI Extraction)\n\n- **Auto-Parsing**: 채용/공모전 링크만 입력하면 LLM이 내용을 분석하여 제목, 마감일, 상금 등을 자동 추출\n- **Curated List**: AI가 분류한 데이터를 바탕으로 개발자/디자이너에게 딱 맞는 공고 추천\n- **Admin Approval**: AI 분석 후 관리자 승인 시스템을 거쳐 데이터 신뢰도 확보',
    '저희는 말로만 AI를 하지 않습니다. 채용 페이지에는 이미 URL만 넣으면 공고 내용을 자동으로 긁어오는 AI 파서가 탑재되어 운영 중입니다.'
),
-- 5. Business & Operations (Admin Dashboard)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    5,
    'grid',
    'Back-office Assessment',
    '### 데이터 기반의 운영 시스템 (Admin)\n\n- **Dashboard**: 일일 방문자, 가입자, 프로젝트 등록 추이를 실시간 차트로 시각화\n- **Management**: 배너, 팝업, 공지사항, FAQ를 개발자 개입 없이 관리자가 직접 제어\n- **Users**: 회원 관리 및 악성 유저 제재 기능 완비',
    '서비스의 지속 가능성은 운영에서 나옵니다. 저희는 이미 완벽한 관리자 대시보드를 구축하여, 모든 데이터를 숫자로 확인하고 통제할 수 있습니다.'
),
-- 6. Tech Stack
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    6,
    'basic',
    'Tech Architecture',
    '### Modern & Scalable Stack\n\n- **Frontend**: Next.js 14 (App Router), TypeScript, Shadcn UI, Tailwind CSS\n- **Backend & DB**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)\n- **AI & Data**: OpenAI API (Extraction), html-to-image (Canvas gen)\n- **Deploy**: Vercel Serverless Functions',
    '빠른 실행력의 비결은 모던한 기술 스택입니다. Next.js 14와 Supabase의 조합으로 개발 생산성을 극대화했습니다.'
),
-- 7. Roadmap
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    7,
    'swot',
    'Roadmap: Scale-up',
    '### 2026 실행 계획\n\n- **Q1 (Done)**: MVP 런칭, 핵심 아카이빙 및 AI 파싱 기능 구현 완료, 어드민 구축\n- **Q2 (Connect)**: 대학생/코딩스쿨 제휴, 해커톤 개최를 통한 초기 콘텐츠 1,000건 확보\n- **Q3 (Monetize)**: 채용 매칭 수수료 모델 도입 및 "Pro" 멤버십(고급 프롬프트 열람) 런칭',
    'Q1 목표였던 MVP 구축은 이미 완료되었습니다. 이제 Q2, 트래픽을 모으고 연결하는 단계로 즉시 넘어갈 준비가 되었습니다.'
),
-- 8. Team
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    8,
    'grid',
    'Team Vibefolio (5조)',
    '### The Builders\n\n- **선효섭/신지호 (Backend)**: 안정적인 데이터 파이프라인 및 관리자 시스템 구축\n- **이승훈/이준호 (Frontend)**: Pixel-perfect UI 구현 및 유저 인터랙션 설계\n- **안승빈/이동엽 (PM/Planning)**: 서비스 기획 및 시장/유저 분석 리딩',
    '저희는 기획으로 끝내지 않습니다. 코드로 증명하는 팀, Vibefolio입니다.'
),
-- 9. Closing
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    9,
    'cover',
    'Vibefolio',
    '상상이 현실이 되는 곳,\nVibefolio에서 당신의 바이브를 보여주세요.\n\n감사합니다.',
    '경청해 주셔서 감사합니다.'
);
