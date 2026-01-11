-- 1. Team 5를 'Vibefolio (5조)'로 변경하고 IR Deck 정보 업데이트
UPDATE ir_decks
SET team_name = 'Vibefolio (5조)',
    title = 'Vibefolio - AI 창작자들을 위한 전용 놀이터',
    description = '바이브코더(AI Creator)를 위한 포트폴리오 아카이빙 및 커뮤니티 플랫폼'
WHERE team_name = 'Vibefolio (5조)';

-- 2. 기존 슬라이드 초기화 (Vibefolio 덱)
DELETE FROM ir_slides 
WHERE deck_id = (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)');

-- 3. 1차 발표자료 기반 상세 IR 슬라이드 생성
INSERT INTO ir_slides (deck_id, order_index, layout_type, title, content, speaker_notes)
VALUES
-- 0. Cover
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    0,
    'cover',
    'Vibefolio',
    'AI 활용 창작자, "바이브코더"를 위한\n단 하나의 포트폴리오 플랫폼',
    '안녕하십니까, 5조 발표자입니다. 저희는 급증하는 AI 창작자들, 즉 "바이브코더"들이 마음껏 놀 수 있는 전용 놀이터, Vibefolio를 소개합니다.'
),
-- 1. Concept (우리의 질문)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    1,
    'big_number',
    'Project Question',
    '### "우리에게 가장 필요한 플랫폼은 무엇일까?"\n\n1. 각자의 프로젝트를 효과적으로 홍보할 수 있는 곳\n2. MVP로 빠르게 유저를 모으고 반응을 확인할 수 있는 곳\n3. **바이브코딩**으로 만든 결과물을 인정받을 수 있는 곳',
    '저희는 이 프로젝트를 시작하며 스스로에게 질문을 던졌습니다. 우리 같은 1인 개발자, 바이브코더들에게 진짜 필요한 공간은 어디일까요?'
),
-- 2. Market Problem (기존 플랫폼의 한계)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    2,
    'swot',
    'Why New Platform?',
    '### 기존 플랫폼(Behance, Notefolio)의 페인 포인트\n\n- **AI에 대한 시선**: 순수 예술가나 기존 창작자들은 AI 창작물을 "쉽게 만든 것"으로 간주하거나 좋지 않게 보는 경향이 있음.\n- **평가의 모호함**: AI 비중이 높으면 실력을 인정받기 어렵고, 커뮤니티 내에서 소외됨.\n- **정보의 부재**: 어떤 모델, 어떤 프롬프트를 썼는지 기술적인 정보 공유가 활발하지 않음.',
    '기존의 훌륭한 플랫폼들이 많지만, AI 창작물을 올리기엔 눈치가 보입니다. "이거 딸깍 해서 만든 거 아니야?"라는 시선 때문이죠.'
),
-- 3. Solution (Vibefolio)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    3,
    'image_left',
    'Solution: AI 창작자의 놀이터',
    '### Vibefolio가 제시하는 해결책\n\n- **전용 놀이터**: AI 사용 여부가 감점 요인이 아닌, 오히려 권장되는 커뮤니티\n- **기술 정보 공유**: 어떤 Model을 썼는지, 어떤 Prompt로 생성했는지 공유하고 학습하는 문화\n- **명확한 정체성**: "AI 활용 창작자(Vibe Coder)"라는 새로운 아이덴티티 부여',
    '그래서 저희는 AI 창작들을 위한 전용 놀이터를 만들기로 했습니다. 이곳에서는 프롬프트와 모델 정보를 공유하는 것이 곧 실력이고 기여입니다.'
),
-- 4. Key Feature 1 (Archive)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    4,
    'grid',
    'Key Feature: Project Archiving',
    '### 프로젝트의 완벽한 포트폴리오화\n\n- **등록 (Upload)**: 카테고리별 분류 및 상세 정보 입력\n- **목록 (Masonry Grid)**: 갤러리 형태의 직관적인 디자인 탐색\n- **상세 (Detail)**: 사용한 AI 툴, 기여도, 기획 의도 등을 상세히 기록',
    '단순한 이미지 나열이 아닙니다. 프로젝트의 기획부터 결과물까지, 하나의 완결된 스토리로 아카이빙할 수 있는 기능을 제공합니다.'
),
-- 5. Key Feature 2 (Profile)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    5,
    'image_right',
    'Key Feature: Creator Profile',
    '### 창작자의 브랜드가 되는 프로필\n\n- **Dashboard**: 내가 올린 프로젝트, 받은 좋아요, 팔로원 현황 한눈에 파악\n- **Interaction**: 팔로잉/팔로워 시스템을 통한 크리에이터 간 네트워킹\n- **My Gallery**: 나만의 작품을 전시하는 퍼스널 브랜딩 공간',
    '개인 프로필 페이지는 그 자체로 훌륭한 이력서가 됩니다. 좋아요와 팔로워 수는 창작자의 영향력을 증명하는 지표가 될 것입니다.'
),
-- 6. Tech Stack
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    6,
    'basic',
    'Tech Stack & Architecture',
    '### Built with Vibe Coding\n\n- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS\n- **Backend**: Supabase (Auth, Database, Storage)\n- **Deployment**: Vercel\n- **Design**: Shadcn UI, Lucid Icons',
    '이 모든 플랫폼은 바이브 코딩 기술을 활용하여 1인 ~ 소규모 팀으로 빠르게 구축되었습니다.'
),
-- 7. Team
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    7,
    'grid',
    'Team Vibefolio (5조)',
    '### The Builders\n\n- **선효섭**: Backend / API Design\n- **신지호**: Database / QA\n- **안승빈**: PM / Strategy\n- **이동엽**: Planning / Content\n- **이승훈**: UI/UX Design\n- **이준호**: Frontend / Branding',
    '저희 6명은 각자의 전문성을 바탕으로 이 프로젝트를 완성해 나가고 있습니다.'
),
-- 8. Closing
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    8,
    'cover',
    'Vibefolio',
    'AI 창작의 가치가 인정받는 곳,\nVibefolio에서 시작하세요.\n\n감사합니다.',
    '경청해 주셔서 감사합니다. Vibefolio에서 여러분의 영감을 펼치세요.'
);
