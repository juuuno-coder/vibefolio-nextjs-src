
const cheerio = require('cheerio');

async function debugThinkContestDeep() {
  const url = 'https://www.thinkcontest.com/thinkgood/user/contest/index.do';
  try {
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log('--- ThinkContest Search ---');
    
    // Find any links that look like contest detail links
    const detailLinks = $('a[href*="view.do"]');
    console.log('Count of view.do links:', detailLinks.length);
    if (detailLinks.length > 0) {
        detailLinks.slice(0, 5).each((i, el) => {
            console.log(`Link ${i+1}: Text="${$(el).text().trim()}", Href="${$(el).attr('href')}"`);
        });
    }

    // Check if there is a table
    const tables = $('table');
    console.log('Count of tables:', tables.length);
    tables.each((i, el) => {
        console.log(`Table ${i+1} Class: ${$(el).attr('class')}, Rows: ${$(el).find('tr').length}`);
        if (i === 0) {
            console.log('Table 1 Header:', $(el).find('th').text().trim());
        }
    });

  } catch (e) {
    console.error('Error:', e.message);
  }
}

debugThinkContestDeep();
