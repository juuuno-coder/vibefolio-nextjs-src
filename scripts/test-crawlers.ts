// scripts/test-crawlers.ts
// 크롤러 테스트 스크립트

import { crawlAll, crawlByType, crawlAIOnly } from '../src/lib/crawlers/crawler.js';
import { isAIRelated, getAIRelevanceScore, AI_KEYWORDS } from '../src/lib/crawlers/sources.js';

async function main() {
  console.log('='.repeat(60));
  console.log('🤖 Vibefolio 크롤러 테스트');
  console.log('='.repeat(60));
  console.log();
  
  // AI 키워드 목록 출력
  console.log(`📌 등록된 AI 키워드: ${AI_KEYWORDS.length}개`);
  console.log(`   예시: ${AI_KEYWORDS.slice(0, 5).join(', ')}...`);
  console.log();
  
  // 전체 크롤링 테스트
  console.log('🔄 전체 크롤링 시작...');
  console.log();
  
  try {
    const result = await crawlAll();
    
    console.log(`✅ 크롤링 완료!`);
    console.log(`   - 총 수집: ${result.itemsFound}개`);
    console.log();
    
    // 유형별 통계
    const jobs = result.items.filter(i => i.type === 'job');
    const contests = result.items.filter(i => i.type === 'contest');
    const events = result.items.filter(i => i.type === 'event');
    
    console.log('📊 유형별 통계:');
    console.log(`   - 채용: ${jobs.length}개`);
    console.log(`   - 공모전: ${contests.length}개`);
    console.log(`   - 이벤트: ${events.length}개`);
    console.log();
    
    // AI 관련 항목 통계
    const aiItems = result.items.filter(i => isAIRelated(i.title, i.description));
    console.log(`🎯 AI 관련 항목: ${aiItems.length}개 (${Math.round(aiItems.length / result.itemsFound * 100)}%)`);
    console.log();
    
    // 상위 5개 항목 출력
    console.log('📋 상위 5개 항목 (AI 연관성 순):');
    result.items.slice(0, 5).forEach((item, idx) => {
      const score = getAIRelevanceScore(item.title, item.description);
      console.log(`   ${idx + 1}. [${item.type}] ${item.title.substring(0, 40)}... (AI점수: ${score})`);
    });
    console.log();
    
    console.log('='.repeat(60));
    console.log('✨ 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 크롤링 오류:', error);
    process.exit(1);
  }
}

main();
