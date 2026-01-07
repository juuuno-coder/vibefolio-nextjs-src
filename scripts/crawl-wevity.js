// scripts/crawl-wevity.js
// Wevity 공모전 크롤링 테스트 스크립트

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');

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

async function crawlWevity() {
  console.log('🚀 Wevity 크롤링 시작...\n');

  try {
    // Wevity 공모전 목록 페이지
    const url = 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=';
    
    console.log(`📡 요청 중: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000
    });

    console.log(`✅ 응답 받음 (${response.status})\n`);

    const $ = cheerio.load(response.data);
    const items = [];

    // Wevity의 실제 HTML 구조 분석 필요
    // 예시: 공모전 목록 아이템 선택자
    $('.list-item, .contest-item, .item').each((i, element) => {
      try {
        // 제목 추출 (여러 가능한 선택자 시도)
        const title = $(element).find('h3, .title, .subject, strong').first().text().trim();
        
        // 링크 추출
        const linkElement = $(element).find('a').first();
        let link = linkElement.attr('href');
        if (link && !link.startsWith('http')) {
          link = 'https://www.wevity.com' + (link.startsWith('/') ? '' : '/') + link;
        }

        // 날짜 추출
        const dateText = $(element).find('.date, .dday, .deadline, time').first().text().trim();
        
        // 설명 추출
        const description = $(element).find('.desc, .description, p').first().text().trim();

        if (title && link) {
          items.push({
            title,
            description: description || '자세한 내용은 링크를 참조하세요.',
            type: 'contest',
            date: parseDate(dateText),
            link,
            company: 'Wevity',
            location: '온라인',
            is_approved: false,
            is_active: false,
            crawled_at: new Date().toISOString()
          });

          console.log(`📝 발견: ${title}`);
        }
      } catch (err) {
        console.error('항목 파싱 오류:', err.message);
      }
    });

    console.log(`\n✅ 총 ${items.length}개 항목 발견\n`);

    // DB에 저장
    if (items.length > 0) {
      for (const item of items) {
        // 중복 체크
        const { data: existing } = await supabase
          .from('recruit_items')
          .select('id')
          .eq('title', item.title)
          .eq('link', item.link)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('recruit_items')
            .insert([item]);

          if (error) {
            console.error(`❌ 저장 실패: ${item.title} - ${error.message}`);
          } else {
            console.log(`✅ 저장 성공: ${item.title}`);
          }
        } else {
          console.log(`⏭️ 중복 건너뜀: ${item.title}`);
        }
      }
    } else {
      console.log('⚠️ 크롤링된 항목이 없습니다.');
      console.log('\n💡 HTML 구조를 확인하고 선택자를 수정해야 합니다.');
      console.log('   브라우저에서 F12를 눌러 Elements 탭을 확인하세요.');
    }

    console.log('\n✨ 크롤링 완료!');

  } catch (error) {
    console.error('💥 크롤링 오류:', error.message);
    
    if (error.response) {
      console.error(`   상태 코드: ${error.response.status}`);
    }
  }
}

// 날짜 파싱 함수
function parseDate(dateText) {
  if (!dateText) {
    // 기본값: 30일 후
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  // "2026.01.31" 형식
  const match = dateText.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }

  // D-day 형식 처리
  const ddayMatch = dateText.match(/D-(\d+)/);
  if (ddayMatch) {
    const days = parseInt(ddayMatch[1]);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  // 파싱 실패 시 30일 후
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

crawlWevity();
