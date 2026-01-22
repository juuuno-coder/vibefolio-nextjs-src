import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processUserQuery } from "@/lib/ai/search-service";

export async function POST(req: NextRequest) {
  // API 키가 없으면 즉시 종료하여 리소스 낭비 방지
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ 
      error: "AI 서비스 점검 중",
      answer: "현재 AI 서비스 안정화를 위해 점검 중입니다. 이용에 불편을 드려 죄송합니다.",
      results: []
    }, { status: 200 });
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Auth Check
    // For demo purposes, we might allow guests, but let's be safe.
    // If no user, we just return the AI response without saving to DB.
    
    const body = await req.json();
    const { message, category, sessionId } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 2. Process AI Request (Agent)
    const agentResponse = await processUserQuery(message, category);

    // 3. Database Persistence (Only if logged in)
    let currentSessionId = sessionId;
    
    if (user) {
      // 3.1 Create Session if needed
      if (!currentSessionId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('ai_chat_sessions')
          .insert({
            user_id: user.id,
            tool_type: category,
            title: message.slice(0, 30) // Simple truncation for title
          })
          .select('id')
          .single();
        
        if (sessionError) {
            console.error('Session Create Error:', sessionError);
        } else {
            currentSessionId = sessionData.id;
        }
      }

      // 3.2 Save User Message
      if (currentSessionId) {
        await supabase.from('ai_chat_messages').insert({
          session_id: currentSessionId,
          role: 'user',
          content: message
        });

        // 3.3 Save Assistant Message
        await supabase.from('ai_chat_messages').insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: agentResponse.answer,
            tool_data: agentResponse.results
        });
      }
    }

    return NextResponse.json({
      sessionId: currentSessionId,
      answer: agentResponse.answer,
      results: agentResponse.results
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
