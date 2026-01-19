
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Helper for Strict Auth
async function validateUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (token.startsWith('vf_')) {
             const { data: keyRecord } = await supabaseAdmin
                .from('api_keys')
                .select('user_id')
                .eq('api_key', token)
                .eq('is_active', true)
                .single();
             if (keyRecord) {
                 return { id: keyRecord.user_id };
             }
        }
    }
    
    // Fallback to Session
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { id: user.id };

    return null;
}

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await validateUser(request);
    if (!authenticatedUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = authenticatedUser;

    // Fetch sessions with their messages
    // tool_type이 'lean-canvas' 이거나 기획 관련인 것만 가져오면 좋겠지만, 
    // 사용자가 무엇을 원할지 모르니 일단 전체를 가져오되 tool_type으로 클라이언트에서 필터링 가능하게 함.
    const { data: sessions, error } = await supabaseAdmin
      .from('ai_chat_sessions')
      .select(`
        id, 
        title, 
        tool_type, 
        created_at,
        ai_chat_messages (
            id,
            role,
            content,
            created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
       console.error('History fetch error:', error);
       return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Process data to find the last *meaningful* assistant message
    const history = sessions.map((session: any) => {
        const messages = session.ai_chat_messages || [];
        // Sort messages by created_at
        messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        // Find the last assistant message that looks like a result (has markdown headers or sufficient length)
        // This avoids picking up short closing remarks like "Any other questions?"
        const reversedMessages = [...messages].reverse();
        
        let targetMessage = reversedMessages.find((m: any) => 
            m.role === 'assistant' && 
            (m.content?.includes('###') || m.content?.includes('**') || m.content?.length > 100)
        );

        // Fallback: If no structured message found, just take the last assistant message
        if (!targetMessage) {
            targetMessage = reversedMessages.find((m: any) => m.role === 'assistant');
        }
        
        return {
            id: session.id,
            title: session.title || 'Untitled Session',
            toolType: session.tool_type,
            createdAt: session.created_at,
            resultContent: targetMessage?.content || null,
            messageCount: messages.length
        };
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
