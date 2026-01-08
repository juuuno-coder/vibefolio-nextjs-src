// scripts/migrate-official-links.ts
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * "25.12.31" 또는 "2025-12-31" 형태의 날짜를 "YYYY-MM-DD"로 변환
 */
function formatDateString(str: string): string {
  if (!str) return str;
  const cleaned = str.replace(/[^\d.]/g, '').replace(/^\.+|\.+$/g, '');
  const parts = cleaned.split('.');
  
  let year, month, day;
  
  if (parts.length === 3) {
    year = parts[0];
    month = parts[1].padStart(2, '0');
    day = parts[2].padStart(2, '0');
    if (year.length === 2) year = '20' + year;
  } else if (parts.length === 2) {
    const now = new Date();
    const currentYear = now.getFullYear();
    month = parts[0].padStart(2, '0');
    day = parts[1].padStart(2, '0');
    year = currentYear.toString();
    const testDate = new Date(`${year}-${month}-${day}`);
    if (testDate.getTime() < now.getTime() - (1000 * 60 * 60 * 24 * 90)) {
       if (now.getMonth() < 3 && parseInt(month) > 9) {
         year = (currentYear - 1).toString();
       }
    }
  } else {
    return str;
  }
  
  return `${year}-${month}-${day}`;
}

async function fetchDetailInfo(detailUrl: string): Promise<any> {
  try {
    const res = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return undefined;
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let officialUrl = $('.contest-detail .btn-area a:contains("홈페이지 바로가기")').attr('href') ||
                      $('.contest-detail-info a:contains("홈페이지 바로가기")').attr('href') ||
                      $('.contest-detail .btn-area a:contains("상세보기")').attr('href') ||
                      $('.contest-detail .btn-area a:contains("지원하기")').attr('href') ||
                      $('.contest-detail .btn-area a:contains("공식")').attr('href') ||
                      $('a:contains("홈페이지")').filter((_, el) => $(el).text().includes('바로가기')).attr('href');
    
    const info: any = { officialLink: officialUrl };
    $('.contest-detail-info li').each((_, el) => {
      const rawText = $(el).text().replace(/\s+/g, ' ').trim();
      const extractValue = (label: string) => {
        if (rawText.includes(label)) {
          return rawText.split(label)[1]?.replace(/^[:\s]+/, '').trim();
        }
        return null;
      };

      const category = extractValue('분야'); if (category) info.categoryTags = category;
      const target = extractValue('대상'); if (target) info.applicationTarget = target;
      const host = extractValue('주최/주관'); if (host) info.company = host;
      const sponsor = extractValue('후원/협찬'); if (sponsor) info.sponsor = sponsor;
      const totalP = extractValue('총 상금'); if (totalP) info.totalPrize = totalP;
      const firstP = extractValue('1등 상금'); if (firstP) info.firstPrize = firstP;
      
      // 상금/혜택 요약 (시상내역 우선, 없으면 총 상금)
      const awardDetail = extractValue('시상내역') || extractValue('상금');
      if (awardDetail) info.prize = awardDetail;
      
      if (rawText.includes('접수기간')) {
        const period = extractValue('접수기간');
        if (period && period.includes('~')) {
          const startPart = period.split('~')[0].trim();
          info.startDate = formatDateString(startPart);
          const endPart = period.split('~')[1].trim();
          info.date = formatDateString(endPart); // 마감일 보정용
        }
      }
    });

    const posterImg = $('.thumb img').attr('src');
    if (posterImg) {
      info.image = posterImg.startsWith('http') ? posterImg : `https://www.wevity.com${posterImg.startsWith('/') ? '' : '/'}${posterImg}`;
    }

    return info;
  } catch (e) {
    return undefined;
  }
}

async function migrate() {
  console.log('🔍 Fetching items to upgrade (Recruit Items & Banners)...');
  
  // 1. Recruit Items 처리 (prize가 비어있거나 wevity 관련 링크를 가진 항목 대상)
  const { data: recruitItems, error: rError } = await supabase
    .from('recruit_items')
    .select('*')
    .eq('type', 'contest'); // 공모전 전체 대상

  if (rError) {
    console.error('Error fetching recruit items:', rError);
  } else {
    console.log(`Found ${recruitItems?.length || 0} recruit items to process.`);
    for (const item of (recruitItems || [])) {
      console.log(`Processing Recruit Item: [${item.id}] ${item.title}`);
      const sourceLink = item.source_link || item.link;
      const detail = await fetchDetailInfo(sourceLink);
      
      if (detail) {
        const { error: updateError } = await supabase
          .from('recruit_items')
          .update({
            link: detail.officialLink || item.link,
            source_link: sourceLink,
            thumbnail: detail.image || item.thumbnail,
            application_target: detail.applicationTarget || item.application_target,
            sponsor: detail.sponsor || item.sponsor,
            total_prize: detail.totalPrize || item.total_prize,
            first_prize: detail.firstPrize || item.first_prize,
            prize: detail.prize || detail.totalPrize || item.prize, // 상금 요약 보정
            start_date: detail.startDate || item.start_date,
            date: detail.date || item.date, // 마감일 보정 반영
            category_tags: detail.categoryTags || item.category_tags,
            company: detail.company || item.company
          })
          .eq('id', item.id);
          
        if (updateError) console.error(`❌ Update failed for recruit item ${item.id}:`, updateError.message);
        else console.log(`🚀 Updated recruit item ${item.id}`);
      }
      await new Promise(r => setTimeout(r, 600));
    }
  }

  // 2. Banners 처리
  const { data: banners, error: bError } = await supabase
    .from('banners')
    .select('*')
    .like('link_url', '%wevity.com%');

  if (bError) {
    console.error('Error fetching banners:', bError);
  } else {
    console.log(`Found ${banners?.length || 0} banner items to process.`);
    for (const banner of (banners || [])) {
      console.log(`Processing Banner: [${banner.id}] ${banner.title}`);
      const detail = await fetchDetailInfo(banner.link_url);
      
      if (detail) {
        const { error: updateError } = await supabase
          .from('banners')
          .update({
            link_url: detail.officialLink || banner.link_url,
            image_url: detail.image || banner.image_url,
            description: detail.categoryTags || banner.description, // 배너 설명에 분야 추가
            subtitle: detail.company || banner.subtitle // 보조 타이틀에 주최측 추가
          })
          .eq('id', banner.id);
          
        if (updateError) console.error(`❌ Update failed for banner ${banner.id}:`, updateError.message);
        else console.log(`🚀 Updated banner ${banner.id}`);
      }
      await new Promise(r => setTimeout(r, 600));
    }
  }
  
  console.log('✨ Data migration and enrichment completed.');
}

migrate();
