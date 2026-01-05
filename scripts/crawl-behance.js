// Behance에서 실제 포트폴리오 데이터를 크롤링하는 스크립트
// 사용법: node scripts/crawl-behance.js

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const categories = [
  { id: 1, name: '포토', url: 'https://www.behance.net/search/projects?field=photography' },
  { id: 3, name: '그래픽', url: 'https://www.behance.net/search/projects?field=graphic%20design' },
  { id: 4, name: '디자인', url: 'https://www.behance.net/search/projects?field=ui%2Fux' },
  { id: 5, name: '영상', url: 'https://www.behance.net/search/projects?field=motion%20graphics' },
  { id: 8, name: '3D', url: 'https://www.behance.net/search/projects?field=3d%20art' },
];

async function getOrCreateUser() {
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  if (existingUser) {
    return existingUser.id;
  }
  
  const { data: newUser, error } = await supabase
    .from('profiles')
    .insert({
      username: 'demo_user',
      email: 'demo@vibefolio.net',
      role: 'user'
    })
    .select()
    .single();
  
  if (error) throw error;
  return newUser.id;
}

async function crawlBehance(category, limit = 10) {
  console.log(`\n🎨 ${category.name} 크롤링 시작...`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log(`  📡 페이지 로딩: ${category.url}`);
    await page.goto(category.url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 스크롤하여 더 많은 이미지 로드
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    // 프로젝트 데이터 추출
    const projects = await page.evaluate((limit) => {
      const items = [];
      const projectCards = document.querySelectorAll('[class*="Project-"] a[href*="/gallery/"]');
      
      for (let i = 0; i < Math.min(projectCards.length, limit); i++) {
        const card = projectCards[i];
        const img = card.querySelector('img');
        const titleEl = card.querySelector('[class*="Title"]');
        
        if (img && img.src) {
          items.push({
            title: titleEl?.textContent?.trim() || `작품 ${i + 1}`,
            imageUrl: img.src,
            link: card.href
          });
        }
      }
      
      return items;
    }, limit);
    
    console.log(`  ✅ ${projects.length}개 프로젝트 발견`);
    return projects;
    
  } catch (error) {
    console.error(`  ❌ 크롤링 실패:`, error.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function saveToDatabase(userId, categoryId, projects) {
  let saved = 0;
  
  for (const project of projects) {
    try {
      const { error } = await supabase
        .from('Project')
        .insert({
          user_id: userId,
          category_id: categoryId,
          title: project.title,
          content_text: project.title,
          thumbnail_url: project.imageUrl,
          image_url: project.imageUrl,
          rendering_type: 'image',
          field: 'it',
          likes_count: Math.floor(Math.random() * 100),
          views_count: Math.floor(Math.random() * 1000),
          created_at: new Date().toISOString(),
        });
      
      if (!error) {
        saved++;
        console.log(`    ✅ ${project.title.substring(0, 40)}...`);
      } else {
        console.error(`    ❌ 저장 실패:`, error.message);
      }
    } catch (err) {
      console.error(`    ❌ 오류:`, err.message);
    }
  }
  
  return saved;
}

async function main() {
  console.log('🚀 Behance 크롤링 시작!\n');
  
  try {
    const userId = await getOrCreateUser();
    console.log(`✅ 사용자 ID: ${userId}\n`);
    
    let totalSaved = 0;
    
    for (const category of categories) {
      const projects = await crawlBehance(category, 8);
      
      if (projects.length > 0) {
        const saved = await saveToDatabase(userId, category.id, projects);
        totalSaved += saved;
        console.log(`  💾 ${saved}개 저장 완료`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`\n🎉 완료! 총 ${totalSaved}개 프로젝트 저장됨`);
    
  } catch (error) {
    console.error('❌ 크롤링 실패:', error);
    process.exit(1);
  }
}

main();
