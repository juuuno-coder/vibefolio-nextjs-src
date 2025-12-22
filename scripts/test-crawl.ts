// scripts/test-crawl.ts
/**
 * 크롤링 테스트 스크립트
 * 
 * 사용법:
 * npx tsx scripts/test-crawl.ts
 */

import { crawlAll } from '../src/lib/crawlers/crawler';

async function testCrawl() {
  console.log('🚀 크롤링 테스트 시작...\n');
  
  const startTime = Date.now();
  
  try {
    const result = await crawlAll();
    
    const duration = Date.now() - startTime;
    
    console.log('\n✅ 크롤링 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 결과 요약:`);
    console.log(`   - 성공 여부: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`   - 발견된 항목: ${result.itemsFound}개`);
    console.log(`   - 소요 시간: ${(duration / 1000).toFixed(2)}초`);
    
    if (result.error) {
      console.log(`   - 오류: ${result.error}`);
    }
    
    console.log('\n📋 발견된 항목 목록:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    result.items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`);
      console.log(`   타입: ${item.type === 'job' ? '채용' : item.type === 'contest' ? '공모전' : '이벤트'}`);
      console.log(`   회사/주최: ${item.company || 'N/A'}`);
      console.log(`   마감일: ${item.date}`);
      console.log(`   위치: ${item.location || 'N/A'}`);
      if (item.salary) console.log(`   급여: ${item.salary}`);
      if (item.prize) console.log(`   상금: ${item.prize}`);
      console.log(`   링크: ${item.link || 'N/A'}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 참고: 현재는 데모 모드로 시뮬레이션 데이터를 생성합니다.');
    console.log('   실제 크롤링을 구현하려면 crawler.ts의 주석을 참고하세요.\n');
    
  } catch (error) {
    console.error('\n❌ 크롤링 중 오류 발생:', error);
    process.exit(1);
  }
}

testCrawl();
