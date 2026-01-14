import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { scores, projectTitle, category } = await request.json();
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      너는 전문 비즈니스 컨설턴트 및 아트 디렉터야. 
      아래 프로젝트에 대한 4가지 지표 점수(5점 만점)를 보고, 작가에게 줄 짧고 날카로운 '전문가 총평'을 150자 내외로 작성해줘.

      프로젝트 제목: ${projectTitle}
      카테고리: ${category}
      
      [평가 지표]
      - 기획력: ${scores.score_1}
      - 완성도: ${scores.score_2}
      - 독창성: ${scores.score_3}
      - 상업성: ${scores.score_4}

      [작성 가이드라인]
      1. 말투는 전문적이고 고무적인 톤으로.
      2. 가장 높은 점수와 가장 낮은 점수를 비교하며 보완점을 제시할 것.
      3. "미슐랭 가이드" 인스펙터가 쓴 듯한 느낌을 줄 것.
      4. 한국어로 작성.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ analysis: text });
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
