[제목]: 데이터의 이관, 로컬에서 서버로
(부제: 2025-12-26, Supabase DB 전면 도입 및 API 연동)

발단: 휘발되는 기억
지금까지 VibeFolio는 기억상실증을 앓고 있었다. 모든 데이터가 사용자의 브라우저(Local Storage)에만 머물렀기에, 브라우저를 닫거나 기기를 바꾸면 모든 프로젝트와 설정이 공기 중으로 흩어졌다. 레오는 진정한 서비스를 만들기 위해 '영구적인 기억', 즉 실제 데이터베이스로의 이전을 선언했다.

전개: 기억의 설계도
안티그래비티는 `schema.sql`을 펼쳐 9개의 테이블을 설계했다. 사용자(User), 프로젝트(Project), 그리고 그들을 잇는 좋아요(Like)와 댓글(Comment)까지. 관계형 데이터베이스의 규율에 맞춰 테이블을 생성하고 RLS 정책을 세워 함부로 데이터를 엿볼 수 없게 했다. 이어 커스텀 인증 시스템을 구축하여, Supabase Auth에 의존하지 않고도 `User` 테이블을 통해 독자적인 회원 관리가 가능하도록 API를 뚫었다.

위기: 권한의 벽과 용량의 압박
API를 구현하는 과정에서 권한 문제(RLS)가 발목을 잡았다. 서버 사이드에서의 요청조차 권한 부족으로 거부당하기 일쑤였다. 또한, 프로젝트 썸네일을 Base64 문자열로 DB에 직접 넣으려다 보니 용량 제한에 걸릴 위험이 컸다. 텍스트와 바이너리 데이터가 뒤섞인 혼돈의 상태였다.

절정: 서비스 롤(Service Role)과 버킷(Bucket)
안티그래비티는 '만능열쇠'를 꺼냈다. 백엔드 로직에서는 RLS를 우회할 수 있는 `supabaseAdmin` 클라이언트를 사용하여 권한 문제를 해결했다. 데이터 용량 문제는 Supabase Storage에 `project-images` 버킷을 생성하여 해결했다. 무거운 이미지는 스토리지에 맡기고, 가벼운 URL만 DB에 저장하는 방식으로 시스템을 경량화했다.

결말: 연결된 세계
이제 데이터는 클라우드에 안전하게 저장되었다. 사용자가 어디서 접속하든 자신의 프로젝트와 관심을 잃어버리지 않게 되었다. API는 쉴 새 없이 데이터를 나르며 프론트엔드와 백엔드를 잇는 혈관 역할을 수행했다. 레오는 로컬의 좁은 방에서 벗어나 넓은 서버의 세상으로 나아간 프로젝트를 보며 벅찬 감정을 느꼈다.

---

🛠 기술적 각주 (Technical Summary)
수정된 파일 (Modified Files):
supabase/schema.sql: 전체 DB 스키마 및 RLS 정책 정의
src/app/api/auth/signup/route.ts: 커스텀 User 테이블 기반 회원가입 API
src/lib/supabase/storage.ts: 이미지 업로드 유틸리티 구현

주요 기술 (Key Tech Stack):
Supabase Database & Storage: 관계형 데이터 관리 및 미디어 파일 호스팅
Next.js App Router API: RESTful API 엔드포인트 구현

핵심 기능 (Key Features):
Full DB Migration: 로컬 스토리지 데이터의 DB 완전 이관
Secure Custom Auth: bcrypt 해싱을 포함한 자체 인증 시스템
