"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { ImageCard } from "@/components/ImageCard";
import { supabase } from "@/lib/supabase/client";

interface Collection {
  collection_id: string;
  name: string;
  description: string;
  created_at: string;
  projects?: any[];
}

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/collections', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        // 각 컬렉션의 프로젝트 가져오기
        const collectionsWithProjects = await Promise.all(
          (data.collections || []).map(async (collection: Collection) => {
            const { data: items, error } = await supabase
              .from('CollectionItem')
              .select(`
                project_id,
                added_at,
                Project (*)
              `)
              .eq('collection_id', collection.collection_id)
              .order('added_at', { ascending: false })
              .limit(20) as any;

            if (error) {
              console.error('프로젝트 로드 실패:', error);
              return { ...collection, projects: [] };
            }

            const projects = items?.map((item: any) => ({
              ...item.Project,
              added_at: item.added_at
            })) || [];

            return { ...collection, projects };
          })
        );
        
        setCollections(collectionsWithProjects);
      }
    } catch (error) {
      console.error('컬렉션 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A] mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">내 컬렉션</h1>
          <p className="text-gray-600 mt-2">저장한 프로젝트를 폴더별로 확인하세요</p>
        </div>

        {/* 컬렉션 목록 */}
        {collections.length > 0 ? (
          <div className="space-y-12">
            {collections.map((collection) => (
              <div key={collection.collection_id}>
                {/* 컬렉션 헤더 */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#16A34A] bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Folder size={20} className="text-[#16A34A]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{collection.name}</h2>
                    {collection.description && (
                      <p className="text-sm text-gray-600">{collection.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {collection.projects?.length || 0}개의 프로젝트
                    </p>
                  </div>
                </div>

                {/* 프로젝트 그리드 */}
                {collection.projects && collection.projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {collection.projects.map((project) => (
                      <ImageCard
                        key={project.project_id}
                        props={{
                          id: project.project_id.toString(),
                          urls: { 
                            regular: project.image_url || project.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
                            full: project.image_url || project.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2000'
                          },
                          user: {
                            username: 'Unknown',
                            profile_image: { 
                              large: '/globe.svg',
                              small: '/globe.svg'
                            }
                          },
                          likes: project.likes_count || 0,
                          views: project.views_count || 0,
                          description: project.description || project.title,
                          alt_description: project.title
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                    <p className="text-gray-500">이 컬렉션에 저장된 프로젝트가 없습니다</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Folder size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">컬렉션이 없습니다</p>
            <p className="text-sm text-gray-500">프로젝트를 저장하여 컬렉션을 만들어보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
