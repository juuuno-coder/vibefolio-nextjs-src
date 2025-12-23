import * as cheerio from 'cheerio';

async function inspect() {
  try {
    console.log('Fetching Wevity...');
    const res = await fetch('https://www.wevity.com/?c=find&s=1&gub=1&cidx=20');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Find a link that looks like a contest view link
    const sampleLink = $('a[href*="gbn=view"]').eq(2); // Skip first few (might be top banner)
    
    if (sampleLink.length === 0) {
      console.log('No links found with gbn=view');
      return;
    }
    
    console.log('Found Link Text:', sampleLink.text().trim());
    console.log('Link Parent Class:', sampleLink.parent().attr('class'));
    console.log('Link Grandparent Class:', sampleLink.parent().parent().attr('class'));
    
    // Try to find the list item container (usually li)
    const li = sampleLink.closest('li');
    if (li.length > 0) {
       console.log('List Item Tag: li');
       console.log('List Item Class:', li.attr('class'));
       console.log('List Item Inner HTML:', li.html()?.replace(/\s+/g, ' ').substring(0, 800));
    } else {
       // Maybe it's div structure
       const div = sampleLink.closest('div.list-item'); // guess
       // Just look up parents
       console.log('Parents:', sampleLink.parents().map((i, el) => $(el).prop('tagName').toLowerCase() + '.' + ($(el).attr('class') || '')).get().join(' < '));
    }

  } catch (e) {
    console.error(e);
  }
}

inspect();
