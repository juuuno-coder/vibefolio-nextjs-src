// src/app/api/recruit/extract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { uploadImageFromUrl } from '@/lib/supabase/storage';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. 페이지 데이터 가져오기 (Timeout 설정)
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // 2. 메타데이터 및 주요 태그 추출 (OG Tag 우선)
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';
    
    // 3. 본문에서 추가 정보 유추 (날짜 등)
    // 날짜 패턴 매칭 (YYYY-MM-DD 또는 YYYY.MM.DD)
    const bodyText = $('body').text();
    const datePattern = /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/;
    const dateMatch = bodyText.match(datePattern);
    let date = "";
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      date = `${year}-${month}-${day}`;
    }

    // 4. 회사명 유추 (사이트 이름 등)
    const siteName = $('meta[property="og:site_name"]').attr('content') || "";

    // 5. 이미지 로컬 아카이빙 (정공법)
    let finalThumbnail = thumbnail;
    if (thumbnail && thumbnail.startsWith('http')) {
      finalThumbnail = await uploadImageFromUrl(thumbnail, 'projects');
    }

    return NextResponse.json({
      success: true,
      title: title.trim(),
      description: description.trim(),
      thumbnail: finalThumbnail,
      date,
      company: siteName,
    });

  } catch (error) {
    console.error('Extraction API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
