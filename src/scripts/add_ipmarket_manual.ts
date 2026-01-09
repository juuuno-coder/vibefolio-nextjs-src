
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as process from 'process';

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Error] Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addManualItem() {
  const item = {
     title: "모두의 아이디어 (아이디어로) - 전 국민 아이디어 공모 플랫폼",
     description: "한국발명진흥회가 운영하는 아이디어 거래 플랫폼 '아이디어로'. 기업, 기관의 과제에 도전하고 나만의 아이디어를 판매하세요.",
     type: 'contest',
     date: '2025-12-31', // 상시 모집 (임의로 연말까지 설정)
     company: "한국발명진흥회",
     prize: "최대 수천만원 (과제별 상이)",
     link: "https://www.ipmarket.or.kr/idearo/index.do",
     // 아이디어/전구 관련 Unsplash 이미지
     thumbnail: "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&q=80&w=800", 
     is_approved: true,
     is_active: true,
     views_count: 0
  };

  // 중복 체크 및 Upsert
  const { data: existing } = await supabase
      .from('recruit_items')
      .select('id')
      .eq('link', item.link)
      .maybeSingle();

  if (existing) {
      console.log(`Updating existing item: ${item.title}`);
      const { error } = await supabase.from('recruit_items').update(item).eq('id', existing.id);
      if (error) console.error(`Error updating:`, error.message);
      else console.log(`Updated successfully.`);
  } else {
      console.log(`Inserting new item: ${item.title}`);
      const { error } = await supabase.from('recruit_items').insert(item);
      if (error) console.error(`Error inserting:`, error.message);
      else console.log(`Inserted successfully.`);
  }
}

addManualItem();
