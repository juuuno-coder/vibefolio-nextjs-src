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

/**
 * 제목 키워드를 분석하여 고화질 테마 이미지를 반환합니다.
 */
function getThemedPlaceholder(title, type) {
  const t = title.toLowerCase();
  // Unsplash signature for deterministic randomness based on title
  return `https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800&h=600&sig=${encodeURIComponent(title)}`;
}

async function crawlWevity() {
  console.log('🚀 Wevity 공모전 크롤링 시작 (이미지 최적화)...\n');

  try {
    const url = 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=20'; 
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const items = [];

    $('.list li, .contest-list li').each((i, element) => {
      try {
        const $el = $(element);
        const $titleLink = $el.find('.tit a, .hide-tit a, a.subject').first();
        const title = $titleLink.text().trim();
        let link = $titleLink.attr('href');
        
        if (!title || !link) return;

        if (link && !link.startsWith('http')) {
          link = 'https://www.wevity.com' + (link.startsWith('/') ? '' : '/') + link;
        }
        
        let thumbnail = $el.find('.thumb img, .img img, .thumb-box img').first().attr('src');
        if (thumbnail && !thumbnail.startsWith('http')) {
          thumbnail = 'https://www.wevity.com' + (thumbnail.startsWith('/') ? '' : '/') + thumbnail;
        }

        // 이미지 부재 시 고화질 플레이스홀더 생성
        if (!thumbnail || thumbnail.includes('no_image') || thumbnail.includes('spacer.gif')) {
          thumbnail = getThemedPlaceholder(title, 'contest');
        }

        const dateText = $el.find('.dday, .hide-dday, .date').first().text().trim();
        const company = $el.find('.organ, .company, .sub-text').first().text().trim() || '위비티';
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
