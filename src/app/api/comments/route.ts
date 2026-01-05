// src/app/api/comments/route.ts
// ?“ê? CRUD API

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

// ?“ê? ì¡°íšŒ
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectIdê°€ ?„ìš”?©ë‹ˆ??' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('Comment')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('?“ê? ì¡°íšŒ ?¤íŒ¨:', error);
      return NextResponse.json(
        { error: '?“ê? ì¡°íšŒ???¤íŒ¨?ˆìŠµ?ˆë‹¤.' },
        { status: 500 }
      );
    }

    // Auth?ì„œ ?¬ìš©???•ë³´ ê°€?¸ì˜¤ê¸?
    if (data && data.length > 0) {
      const userIds = Array.from(new Set(data.map((c: any) => c.user_id).filter(Boolean))) as string[];
      
      const userPromises = userIds.map(async (uid) => {
        try {
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(uid);
          if (authData.user) {
            return {
              user_id: authData.user.id,
              username: authData.user.user_metadata?.username || authData.user.email?.split('@')[0] || 'Unknown',
              profile_image_url: authData.user.user_metadata?.profile_image_url || '/globe.svg'
            };
          }
        } catch (e) {
          console.error(`?¬ìš©??${uid} ?•ë³´ ì¡°íšŒ ?¤íŒ¨:`, e);
        }
        return null;
      });

      const users = await Promise.all(userPromises);
      const userMap = new Map(
        users
          .filter((u): u is NonNullable<typeof u> => u !== null)
          .map(u => [u.user_id, u])
      );

      data.forEach((comment: any) => {
        const user = userMap.get(comment.user_id);
        comment.user = user ? {
          username: user.username,
          profile_image_url: user.profile_image_url
        } : {
          username: 'Unknown',
          profile_image_url: '/globe.svg'
        };
      });

      // ?€?“ê? êµ¬ì¡°??
      const commentMap = new Map();
      const rootComments: any[] = [];

      data.forEach((comment: any) => {
        comment.replies = [];
        commentMap.set(comment.comment_id, comment);
      });

      data.forEach((comment: any) => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      return NextResponse.json({ comments: rootComments });
    }

    return NextResponse.json({ comments: data });
  } catch (error) {
    console.error('?œë²„ ?¤ë¥˜:', error);
    return NextResponse.json(
      { error: '?œë²„ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.' },
      { status: 500 }
    );
  }
}

// ?“ê? ?‘ì„±
export async function POST(request: NextRequest) {
  try {
    // Authorization ?¤ë”?ì„œ ? í° ì¶”ì¶œ
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '?¸ì¦???¤íŒ¨?ˆìŠµ?ˆë‹¤.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, content, parentCommentId, mentionedUserId } = body;

    console.log('?“ê? ?‘ì„± ?”ì²­:', { 
      userId: user.id, 
      projectId, 
      content, 
      parentCommentId, 
      mentionedUserId 
    });

    if (!projectId || !content) {
      return NextResponse.json(
        { error: '?„ìˆ˜ ?„ë“œê°€ ?„ë½?˜ì—ˆ?µë‹ˆ??' },
        { status: 400 }
      );
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('Comment')
      .insert([
        {
          user_id: user.id,
          project_id: projectId,
          content,
          parent_comment_id: parentCommentId || null,
          mentioned_user_id: mentionedUserId || null,
        },
      ] as any)
      .select('*')
      .single();

    if (error) {
      console.error('?“ê? ?‘ì„± ?¤íŒ¨:', error);
      return NextResponse.json(
        { error: `?“ê? ?‘ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤: ${error.message || error.code}` },
        { status: 500 }
      );
    }

    console.log('?“ê? ?‘ì„± ?±ê³µ:', data);

    // ?‘ì„±???¬ìš©???•ë³´ ì¶”ê?
    data.user = {
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown',
      profile_image_url: user.user_metadata?.profile_image_url || '/globe.svg'
    };

    return NextResponse.json(
      {
        message: '?“ê????‘ì„±?˜ì—ˆ?µë‹ˆ??',
        comment: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('?œë²„ ?¤ë¥˜:', error);
    return NextResponse.json(
      { error: '?œë²„ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.' },
      { status: 500 }
    );
  }
}

// ?“ê? ?? œ (?Œí”„???? œ)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId');

    if (!commentId || !userId) {
      return NextResponse.json(
        { error: 'commentId?€ userIdê°€ ?„ìš”?©ë‹ˆ??' },
        { status: 400 }
      );
    }

    // ?“ê? ?Œìœ ???•ì¸
    const { data: comment } = await supabaseAdmin
      .from('Comment')
      .select('user_id')
      .eq('comment_id', commentId)
      .single() as { data: any, error: any }; // ?€???¨ì–¸ ì¶”ê?

    if (!comment) {
      return NextResponse.json(
        { error: '?“ê???ì°¾ì„ ???†ìŠµ?ˆë‹¤.' },
        { status: 404 }
      );
    }

    // UUID ë¹„êµ (ë¬¸ì??
    if (comment.user_id !== userId) {
      return NextResponse.json(
        { error: '?“ê????? œ??ê¶Œí•œ???†ìŠµ?ˆë‹¤.' },
        { status: 403 }
      );
    }

    // ?Œí”„???? œ
    const { error } = await (supabaseAdmin as any)
      .from('Comment')
      .update({ is_deleted: true })
      .eq('comment_id', commentId);

    if (error) {
      console.error('?“ê? ?? œ ?¤íŒ¨:', error);
      return NextResponse.json(
        { error: '?“ê? ?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '?“ê????? œ?˜ì—ˆ?µë‹ˆ??' });
  } catch (error) {
    console.error('?œë²„ ?¤ë¥˜:', error);
    return NextResponse.json(
      { error: '?œë²„ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.' },
      { status: 500 }
    );
  }
}
