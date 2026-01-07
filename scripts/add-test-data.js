// scripts/add-test-data.js
// 테스트용 채용/공모전 데이터 추가 스크립트

// 로컬 환경에서 .env.local 파일 읽기
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// 환경변수 확인
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수가 설정되지 않았습니다!');
  process.exit(1);
}

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 테스트 데이터
const testItems = [
  {
    title: '2025 AI 영상 콘테스트 - 테스트',
    description: 'AI 기술을 활용한 창의적인 영상 콘텐츠 공모전입니다. 크롤링 시스템 테스트용 데이터입니다.',
    type: 'contest',
    date: '2026-02-28',
    company: '테스트 주최사',
    prize: '총 상금 500만원',
    location: '온라인',
    link: 'https://example.com/contest',
    is_approved: false, // 승인 대기 상태
    is_active: false,
    crawled_at: new Date().toISOString()
  },
  {
    title: 'UI/UX 디자이너 채용 - 테스트',
    description: '크리에이티브한 디자이너를 모집합니다. 크롤링 시스템 테스트용 데이터입니다.',
    type: 'job',
    date: '2026-02-15',
    company: '테스트 기업',
    salary: '연봉 4,000~6,000만원',
    location: '서울 강남구',
    employment_type: '정규직',
    link: 'https://example.com/job',
    is_approved: false, // 승인 대기 상태
    is_active: false,
    crawled_at: new Date().toISOString()
  },
  {
    title: 'AI 영화제작 워크샵 - 테스트',
    description: 'AI 툴을 활용한 영화 제작 실습 워크샵입니다. 크롤링 시스템 테스트용 데이터입니다.',
    type: 'event',
    date: '2026-01-25',
    company: '테스트 교육기관',
    location: '서울 마포구',
    link: 'https://example.com/event',
    is_approved: false, // 승인 대기 상태
    is_active: false,
    crawled_at: new Date().toISOString()
  }
];

async function addTestData() {
  console.log('🚀 테스트 데이터 추가 시작...\n');

  try {
    for (const item of testItems) {
      console.log(`📝 추가 중: ${item.title}`);
      
      const { data, error } = await supabase
        .from('recruit_items')
        .insert([item])
        .select();

      if (error) {
        console.error(`❌ 실패: ${error.message}`);
      } else {
        console.log(`✅ 성공! ID: ${data[0].id}`);
      }
    }

    console.log('\n✨ 테스트 데이터 추가 완료!');
    console.log('\n📋 다음 단계:');
    console.log('1. /admin/recruit-approval 페이지에서 항목 확인');
    console.log('2. 승인 버튼 클릭');
    console.log('3. /recruit 페이지에서 승인된 항목 확인');
    
  } catch (error) {
    console.error('💥 오류 발생:', error);
    process.exit(1);
  }
}

addTestData();
