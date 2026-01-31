import { Suspense } from "react";
import { supabase } from "@/lib/supabase/client";
import HomeClient from "./HomeClient";

// 서버에서 초기 프로젝트 데이터를 미리 가져옴 (SSR)
export const revalidate = 60; // 1분마다 재검증

async function getInitialProjects() {
  try {
    const nowISO = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('Project')
      .select(`
        project_id, user_id, category_id, title, rendering_type, 
        thumbnail_url, views_count, likes_count, created_at, 
        custom_data, allow_michelin_rating, allow_stickers, 
        allow_secret_comments, visibility, scheduled_at, audit_deadline, is_growth_requested
      `)
      .is('deleted_at', null)
      .eq('visibility', 'public')
      .or(`scheduled_at.is.null,scheduled_at.lte.${nowISO}`)
      .order('created_at', { ascending: false })
      .range(0, 19); // 첫 20개

    if (error) throw error;
    
    if (data && data.length > 0) {
      // 작성자 정보 병합
      const userIds = [...new Set(data.map((p: any) => p.user_id).filter(Boolean))] as string[];
      
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, expertise')
          .in('id', userIds);

        const userMap = new Map();
        usersData?.forEach((u: any) => {
          userMap.set(u.id, {
            username: u.username || 'Unknown',
            avatar_url: u.avatar_url || '/globe.svg',
            expertise: u.expertise || null,
          });
        });

        data.forEach((project: any) => {
          project.users = userMap.get(project.user_id) || { username: 'Unknown', avatar_url: '/globe.svg' };
        });
      }
    }

    return data || [];
  } catch (error) {
    console.error('[SSR] Failed to fetch initial projects:', error);
    return [];
  }
}

export default async function Home() {
  // 서버에서 초기 데이터 가져오기
  const initialProjects = await getInitialProjects();

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeClient initialProjects={initialProjects} />
    </Suspense>
  );
}
