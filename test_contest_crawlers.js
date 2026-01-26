
const cheerio = require('cheerio');

async function testWevity() {
  console.log('Testing Wevity...');
  const url = 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=21'; // IT/SW
  try {
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const list = $('.list li, .contest-list li');
    console.log(`Wevity found ${list.length} items`);
    list.slice(0, 3).each((i, el) => {
      console.log(`Item ${i+1}:`, $(el).find('.tit a').text().trim() || 'No Title');
    });
  } catch (e) {
    console.error('Wevity Error:', e.message);
  }
}

async function testThinkContest() {
  console.log('\nTesting ThinkContest...');
  const url = 'https://www.thinkcontest.com/thinkgood/user/contest/index.do';
  try {
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const selectors = ['.contest-list li', '.list-item', '.contest-item', '.board-list li', 'ul.list > li'];
    selectors.forEach(sel => {
      console.log(`Selector "${sel}": ${$(sel).length} items`);
    });
    
    // Check if there's any content at all
    console.log('Body length:', html.length);
  } catch (e) {
    console.error('ThinkContest Error:', e.message);
  }
}

async function run() {
  await testWevity();
  await testThinkContest();
}

run();
