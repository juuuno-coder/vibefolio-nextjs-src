
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

async function check() {
  try {
    const url = 'https://www.ipmarket.or.kr/idearo/service/idc/chlg/idcMain.do';
    console.log(`Fetching ${url}...`);
    
    // 브라우저처럼 위장하여 요청
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.ipmarket.or.kr/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      },
      // 한글 깨짐 방지? (보통 axios는 utf-8 처리함. EUC-KR일 경우 arraybuffer로 받아야 함)
      responseType: 'arraybuffer' 
    });
    
    // 디코딩 (UTF-8 가정, 만약 EUC-KR이면 iconv-lite 필요. 일단 UTF-8 시도)
    const decoder = new TextDecoder('utf-8');
    const html = decoder.decode(data);

    console.log(`Fetched ${html.length} chars.`);
    
    // 파일로 저장
    const filePath = path.join(process.cwd(), 'src', 'scripts', 'ipmarket_dump.html');
    fs.writeFileSync(filePath, html);
    console.log(`Saved dump to ${filePath}`);

  } catch (error: any) {
    console.error('Fetch failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

check();
