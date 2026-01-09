
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as process from 'process';

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 크롤링 등 백엔드 작업에는 Service Role Key가 권장되나, 없으면 Anon Key 시도
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Error] Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_URL = 'https://www.ipmarket.or.kr/idearo/service/idc/chlg/idcMain.do';
const BASE_URL = 'https://www.ipmarket.or.kr';

async function crawl() {
  try {
    console.log(`Fetching ${TARGET_URL}...`);
    // Axios 요청 (User-Agent 설정)
    const { data } = await axios.get(TARGET_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.ipmarket.or.kr/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        },
        responseType: 'arraybuffer' // 인코딩 문제 대비
    });

    const decoder = new TextDecoder('utf-8');
    const html = decoder.decode(data);
    const $ = cheerio.load(html);

    const items: any[] = [];
    
    // 리스트 순회 (.cad_box_list .list > div)
    $('.cad_box_list .list > div').each((i, el) => {
        const $el = $(el);
        const titleRaw = $el.find('.text .title').text();
        const title = titleRaw.replace(/[\n\t]+/g, ' ').trim();
        
        if (!title) return;

        const organizerRaw = $el.find('.text .id').text();
        const organizer = organizerRaw.split('|')[0].trim();
        
        const dateStr = $el.find('.text .day').text().trim(); // 2025-09-08
        
        // 상금: .text2 span 중 숫자 포함된 것
        const prizeraw = $el.find('.text2').text().replace(/[\n\t]+/g, '').trim();
        // 간단히 처리 (첫 번째 span 내용 가져오기 시도)
        let prize = $el.find('.text2 > span:first-child').text().trim();
        if(!prize) prize = prizeraw.substring(0, 20); // fallback

        // 링크 추출 (javascript:goDetailPage('ID'))
        const href = $el.find('a.item').attr('href');
        let link = '';
        if (href && href.includes('goDetailPage')) {
            const match = href.match(/'([^']+)'/);
            if (match) {
                link = `${BASE_URL}/idearo/service/idc/chlg/idcDetail.do?idcManageId=${match[1]}`;
            }
        }
        
        // 썸네일
        let thumbnail = $el.find('.img img').attr('src');
        if (thumbnail && !thumbnail.startsWith('http')) {
            thumbnail = BASE_URL + thumbnail;
        }
        // 기본 썸네일 처리
        if (thumbnail?.includes('no_image')) thumbnail = undefined;

        // 키워드 필터링 (AI 관련)
        const keywords = ['AI', '인공지능', '데이터', 'SW', '소프트웨어', '지능형', '로봇', '스마트', '디지털', '플랫폼', '기술'];
        // 광범위하게 잡기 위해 키워드 추가
        const isAI = keywords.some(k => title.toUpperCase().includes(k) || title.includes(k));

        if (link && isAI) {
             items.push({
                 title: title,
                 description: `${organizer}에서 주관하는 아이디어 공모전입니다.`,
                 type: 'contest',
                 date: dateStr, // 마감일
                 company: organizer,
                 prize: prize,
                 link: link,
                 thumbnail: thumbnail,
                 is_approved: true, // 즉시 승인 (확인용)
                 is_active: true,
                 views_count: 0
             });
        }
    });

    console.log(`Found ${items.length} AI-related items.`);

    // DB 저장
    for (const item of items) {
        // 중복 체크 (link 기준)
        const { data: existing } = await supabase
            .from('recruit_items')
            .select('id')
            .eq('link', item.link)
            .maybeSingle();

        if (!existing) {
            const { error } = await supabase.from('recruit_items').insert(item);
            if (error) {
                console.error(`Error inserting ${item.title}:`, error.message);
            } else {
                console.log(`Inserted: ${item.title}`);
            }
        } else {
            console.log(`Skipped (Duplicate): ${item.title}`);
        }
    }

  } catch (e: any) {
    console.error('Crawl failed:', e.message);
    if (e.response) console.error('Status:', e.response.status);
  }
}

crawl();
