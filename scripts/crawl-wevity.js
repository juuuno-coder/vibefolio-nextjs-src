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
  console.log('🚀 Wevity 공모전 크롤링 시작 (이미지 포함)...\n');

  try {
    // Wevity 공모전 목록 페이지 (디자인/웹/IT 카테고리 등)
    const url = 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=20'; 
    
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

    // 위비티 리스트 항목 파싱
    $('.list li, .contest-list li').each((i, element) => {
      try {
        const $el = $(element);
        
        // 제목 및 링크
        const $titleLink = $el.find('.tit a, .hide-tit a, a.subject').first();
        const title = $titleLink.text().trim();
        let link = $titleLink.attr('href');
        
        if (!title || !link) return;

        if (link && !link.startsWith('http')) {
          link = 'https://www.wevity.com' + (link.startsWith('/') ? '' : '/') + link;
        }
        
        // 이미지 (썸네일)
        const $img = $el.find('.thumb img, .img img, img').first();
        let thumbnail = $img.attr('src');
        if (thumbnail && !thumbnail.startsWith('http')) {
          thumbnail = 'https://www.wevity.com' + (thumbnail.startsWith('/') ? '' : '/') + thumbnail;
        }

        // 날짜 (마감일)
        const dateText = $el.find('.dday, .hide-dday, .date').first().text().trim();
        
        // 주최사
        const company = $el.find('.organ, .company, .sub-text').first().text().trim() || '위비티';
        
        // 설명/카테고리
        const description = $el.find('.desc, .cat, .category').first().text().trim();

        items.push({
          title,
          description: description || `${company}에서 주최하는 공모전입니다.`,
          type: 'contest',
          date: parseDate(dateText),
          link,
          company,
          thumbnail,
          location: '온라인',
          is_approved: true, 
          is_active: true,
          crawled_at: new Date().toISOString()
        });

        console.log(`📝 발견: ${title}`);
      } catch (err) {
        console.error('항목 파싱 오류:', err.message);
      }
    });

    console.log(`\n✅ 총 ${items.length}개 항목 발견\n`);

    // DB에 저장
    if (items.length > 0) {
      for (const item of items) {
        // 중복 체크 (제목으로 확인)
        const { data: existing } = await supabase
          .from('recruit_items')
          .select('id')
          .eq('title', item.title)
          .maybeSingle();

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
      console.log('⚠️ 크롤링된 항목이 없습니다. 선택자를 확인하세요.');
    }

    console.log('\n✨ 크롤링 완료!');

  } catch (error) {
    console.error('💥 크롤링 오류:', error.message);
  }
}

// 날짜 파싱 함수
function parseDate(dateText) {
  if (!dateText) {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  // D-day 형식 처리 (D-15 등)
  const ddayMatch = dateText.match(/D-(\d+)/i);
  if (ddayMatch) {
    const days = parseInt(ddayMatch[1]);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  // "2026.01.31" 형식
  const match = dateText.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }

  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

crawlWevity();
