// scripts/migrate-official-links.ts
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
                      $('a:contains("홈페이지")').filter((_, el) => $(el).text().includes('바로가기')).attr('href');
    
    const info: any = { officialLink: officialUrl };
    $('.contest-detail-info li').each((_, el) => {
      const text = $(el).text();
      if (text.includes('분야')) info.categoryTags = text.replace('분야', '').trim();
      if (text.includes('대상')) info.applicationTarget = text.replace('대상', '').trim();
      if (text.includes('주최/주관')) info.company = text.replace('주최/주관', '').trim();
      if (text.includes('후원/협찬')) info.sponsor = text.replace('후원/협찬', '').trim();
      if (text.includes('총 상금')) info.totalPrize = text.replace('총 상금', '').trim();
      if (text.includes('1등 상금')) info.firstPrize = text.replace('1등 상금', '').trim();
      if (text.includes('접수기간')) {
        const period = text.replace('접수기간', '').trim();
        if (period.includes('~')) {
          info.startDate = period.split('~')[0].trim();
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
  
  // 1. Recruit Items 처리
  const { data: recruitItems, error: rError } = await supabase
    .from('recruit_items')
    .select('*')
    .or('link.like.%wevity.com%,source_link.like.%wevity.com%');

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
            start_date: detail.startDate || item.start_date,
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
