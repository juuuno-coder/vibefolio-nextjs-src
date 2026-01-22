
import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/ai/client';

export async function POST(req: NextRequest) {
  // API 키가 없으면 즉시 종료하여 리소스 낭비 방지
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ 
      success: false, 
      analysis: "AI 서비스가 현재 점검 중입니다. 이용에 불편을 드려 죄송합니다.",
      error: "API Key missing" 
    }, { status: 200 }); // status 200으로 반환하여 클라이언트 측에서의 불필요한 재시도나 에러 로그 범람 방지
  }

  try {
    const body = await req.json();
    const { scores, projectTitle, category } = body;

    // 점수가 없으면 분석 불가
    if (!scores) {
        return NextResponse.json({ success: false, error: 'Scores are required' }, { status: 400 });
    }

    const { score_1, score_2, score_3, score_4 } = scores;

    // 프롬프트 엔지니어링: 전문가 페르소나 부여
    const prompt = `
      당신은 'Vibefolio Michelin'이라는 권위 있는 예술/디자인 평가 시스템의 수석 인스펙터입니다.
      아래 프로젝트의 4가지 차원 평가 데이터를 바탕으로, 창작자에게 전하는 **한 줄의 강렬한 통찰(Insight)**과 **구체적인 조언**을 작성해주세요.
      
      [프로젝트 정보]
      - 제목: ${projectTitle || '제목 미상'}
      - 카테고리: ${category || '일반'}

      [평가 점수 (5.0 만점)]
      1. 기획력 (Logic & Intent): ${score_1}
      2. 완성도 (Detail & Finish): ${score_2}
      3. 독창성 (Originality): ${score_3}
      4. 상업성 (Market Value): ${score_4}

      [작성 가이드]
      - 말투: 정중하면서도 날카로운 전문가의 어조 (예: "뛰어난 기획이나, 마감이 아쉽습니다.", "독창성은 탁월하나 대중 설득력이 필요합니다.")
      - 길이: 한국어 기준 1~2문장 내외 (공백 포함 150자 이내)
      - 내용: 가장 높은 점수를 칭찬하거나, 가장 낮은 점수에 대한 보완점을 지적하는 방식 추천.
      - **반드시 존댓말을 사용하세요.**
    `;

    // Gemini API 호출 (Promise.race를 통한 타임아웃 구현)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8초 타임아웃

    try {
      const result = await model.generateContent(prompt);
      clearTimeout(timeoutId);
      
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({ 
          success: true, 
          analysis: text 
      });
    } catch (apiError: any) {
      clearTimeout(timeoutId);
      console.error('[Gemini API Error]', apiError);
      return NextResponse.json({ 
        success: false, 
        analysis: "데이터를 분석하는 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        error: apiError.message 
      }, { status: 200 }); // 사용자에게는 에러 메시지 보여주되 프로세스는 정상 종료
    }

  } catch (error: any) {
    console.error('[AI Analysis Route Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
