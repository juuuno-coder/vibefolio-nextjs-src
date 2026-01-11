-- 1. Team 5를 'Vibefolio (5조)'로 변경하고 IR Deck 정보 업데이트
UPDATE ir_decks
SET team_name = 'Vibefolio (5조)',
    title = 'Vibefolio - 경험을 잇다, 기회를 짓다',
    description = '예비 창업가와 전문가를 잇는 디지털 창업 가속화 및 포트폴리오 플랫폼'
WHERE team_name = 'Team 5';

-- 2. 기존 슬라이드 초기화 (Vibefolio 덱)
DELETE FROM ir_slides 
WHERE deck_id = (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)');

-- 3. 회의록 기반 상세 IR 슬라이드 생성
INSERT INTO ir_slides (deck_id, order_index, layout_type, title, content, speaker_notes)
VALUES
-- 0. Cover
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    0,
    'cover',
    'Vibefolio',
    '경험을 잇다, 기회를 짓다.\n\n빈틈은 메우고 경험은 채우는,\n우리들의 스타트업 케미스트리.',
    '안녕하십니까, 5조 발표자입니다. 예비 창업가와 전문가의 핵심 역량 불균형을 해결하여 초기 기업의 생존율을 높이는 ‘Vibefolio’를 소개합니다.'
),
-- 1. Problem (Pain Point: 핵심 역량 불균형)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    1,
    'basic',
    'Problem: 핵심 역량의 불균형 (The Imbalance)',
    '### 초기 창업 팀의 딜레마\n\n1. **기획자(Visionary)**: 아이디어와 BM은 있지만, 이를 실현할 기술(Coding) 역량이 부재함.\n2. **개발자(Architect)**: 기술 구현력은 뛰어나지만, "어떤 서비스"를 만들어야 시장성이 있는지 모름.\n3. **디자이너(Artist)**: 심미적 역량은 있으나, 실제 사용자 데이터와 기술적 구현 경험이 부족함.\n\n> "기획자는 개발자를 못 구해서, 개발자는 무엇을 만들지 몰라서 멈춰있습니다."',
    '저희는 이를 "Core Competency Imbalance"라고 정의했습니다. 기획자는 기술 구현을 못해 아이디어 단계에서 멈추고, 개발자는 단순 외주 코더로 전락하는 현실입니다.'
),
-- 2. Solution (Vibefolio Platform)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    2,
    'image_right',
    'Solution: 초연결 협업 플랫폼',
    '### Vibefolio가 제시하는 해결책\n\n- **실체 있는 매칭**: 단순 이력서가 아닌, 실제 프로젝트(포트폴리오) 기반의 매칭\n- **바이브 코딩의 보완**: AI 코딩의 한계(할루시네이션 등)를 기획자가 감독할 수 있도록 프로세스화\n- **품앗이 문화의 IT화**: 서로의 부족한 역량을 재능 교환(Credit) 및 지분 협업으로 해결',
    '바이브폴리오는 단순한 채용 사이트가 아닙니다. 기획자의 아이디어를 개발자의 기술로, 개발자의 기술을 디자이너의 감각으로 연결하는 "스타트업 케미스트리" 플랫폼입니다.'
),
-- 3. Persona & Target (3-Types)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    3,
    'grid',
    'Who is our Target?',
    '### 세 가지 핵심 페르소나\n\n- **Persona A (Visionary)**: BM 중심 기획가. 기술 파트너가 절실함.\n- **Persona B (Architect)**: 기술 중심 개발자. 시장성 있는 아이템과 공동 창업 기회를 원함.\n- **Persona C (Artist)**: UX 전문가. 실제 서비스 런칭 경험을 통한 커리어 도약을 희망함.',
    '저희는 이 세 그룹을 유기적으로 연결합니다. 기획자는 CTO를 얻고, 개발자는 나만의 서비스를 갖게 되며, 디자이너는 살아있는 포트폴리오를 얻습니다.'
),
-- 4. Market Value (Why Now?)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    4,
    'basic',
    'Market Value & Impact',
    '### 왜 지금인가?\n\n1. **개발 비용 절감**: 초기 자본 없는 창업가들이 외주 비용 없이 팀 빌딩 가능\n2. **실패 비용 최소화**: 혼자 고민하다 망하는 것이 아닌, 전문가 집단(Peer Group)의 빠른 피드백과 검증\n3. **1인 창조기업 생태계**: 파편화된 IT 인재들을 하나의 구심점으로 모아 "자생적 창업 커뮤니티" 형성',
    '외주 비용 때문에 포기했던 아이디어들이 Vibefolio 안에서는 "기여(Contribute)" 문화를 통해 실현됩니다. 이는 일자리 창출의 선순환으로 이어집니다.'
),
-- 5. Business Model (BM)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    5,
    'grid',
    'Business Model',
    '### 수익화 전략 (4-Track)\n\n1. **Social Currency (Credit)**: 상호 기여 시 크레딧 발급 -> 유료 아이템/상담 결제 시 소모\n2. **인재 매칭 수수료**: 검증된 포트폴리오 기반 인재 파견 및 채용 성사 수수료\n3. **교육 (Mini MBA)**: 기획/개발/마케팅 실무 교육 (유료 세미나/클래스)\n4. **기업 연계 해커톤**: 기업 API 활용 해커톤 개최 스폰서십',
    '초기에는 크레딧 시스템으로 트래픽을 모으고, 이후 검증된 인재 풀을 활용한 HR 매칭과 교육 사업으로 수익을 극대화합니다.'
),
-- 6. Product Roadmap
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    6,
    'swot',
    'Roadmap: From Project to Career',
    '### 2026 실행 계획\n\n- **Q1 (Build)**: MVP 런칭, 노트폴리오/비핸스 벤치마킹한 기본 아카이빙 기능 구현\n- **Q2 (Connect)**: 대학생/코딩스쿨 제휴를 통한 초기 유저(Seed) 확보 및 해커톤 개최\n- **Q3 (Expand)**: 크레딧 시스템 도입 및 프리미엄(Pro) 멤버십 런칭',
    '현재 1단계인 아카이빙 기능 구현은 완료되었습니다. 이제 대학 및 교육 기관과 연계하여 초기 유저를 공격적으로 확보할 계획입니다.'
),
-- 7. Team (The Dream Team)
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    7,
    'grid',
    'Team Vibefolio (5조)',
    '### 우리는 이미 증명했습니다\n\n- **기획/PM (이동엽, 안승빈)**: 페르소나 정의 및 BM 설계, 기능 명세 고도화\n- **Frontend/Design (이준호, 이승훈)**: Shadcn UI 기반 반응형 웹 구축, UX 시나리오 설계\n- **Backend/API (선효섭, 신지호)**: Supabase DB 설계, API 명세 및 데이터 파이프라인 구축',
    '저희 5조는 기획, 디자인, 개발의 밸런스가 완벽한 팀입니다. 이 프로젝트 자체가 Vibefolio의 성공 가능성을 증명하는 첫 번째 사례입니다.'
),
-- 8. Closing
(
    (SELECT id FROM ir_decks WHERE team_name = 'Vibefolio (5조)'),
    8,
    'cover',
    'Vibefolio',
    '함께할 때 더 빛나는 우리의 Vibe.\n감사합니다.\n\nContact: 5team@vibefolio.net',
    '경청해 주셔서 감사합니다. 질문 있으신가요?'
);
