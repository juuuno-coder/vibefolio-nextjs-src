
const cheerio = require('cheerio');

async function debugThinkContest() {
  const url = 'https://www.thinkcontest.com/thinkgood/user/contest/index.do';
  try {
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log('--- ThinkContest Debug ---');
    console.log('Title:', $('title').text());
    
    // Find all <ul> and <div> that might be a list
    $('ul, div').each((i, el) => {
      const cls = $(el).attr('class');
      const id = $(el).attr('id');
      if (cls && (cls.includes('list') || cls.includes('content') || cls.includes('board'))) {
        const itemP = $(el).find('li, .item, tr').length;
        if (itemP > 0) {
            console.log(`Tag: ${el.name}, Class: ${cls}, ID: ${id || 'none'}, Children (li/item/tr): ${itemP}`);
            if (i < 50 && itemP > 2) {
                // Peek first child
                console.log('   First child text peek:', $(el).find('li, .item, tr').first().text().trim().substring(0, 50));
            }
        }
      }
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

debugThinkContest();
