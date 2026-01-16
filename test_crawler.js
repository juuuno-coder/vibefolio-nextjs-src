const cheerio = require('cheerio');

async function testNaver(keyword) {
  const query = encodeURIComponent(keyword);
  const url = `https://search.naver.com/search.naver?where=news&query=${query}&sm=tab_opt&sort=1`;
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Find one link
    let $link = null;
    $('a').each((i, el) => {
        if (! $link && $(el).text().includes('카카오') && $(el).text().length > 20) {
            $link = $(el);
        }
    });

    if ($link) {
        console.log('Link:', $link.text());
        console.log('Parent Class:', $link.parent().attr('class'));
        console.log('GrandParent Class:', $link.parent().parent().attr('class'));
        console.log('GreatGrandParent Class:', $link.parent().parent().parent().attr('class'));
    }
  } catch (e) { console.error(e); }
}

testNaver("카카오");
