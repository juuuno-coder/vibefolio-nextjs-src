"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Folder, MoreVertical, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/ImageCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase/client";

interface CollectionProject {
  id: string;
  title: string;
  urls: {
    full: string;
    regular: string;
  };
  user: {
    username: string;
    profile_image: {
      small: string;
      large: string;
    };
  };
  likes: number;
  views: number;
}

interface CollectionDetail {
  collection_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // params is a Promise in Next.js 15+, need to unwrap it or use use()
  // Since we're in a client component and assuming Next.js 13/14 convention where params is passed as prop
  // However, specifically in newer Next.js or if treating params as promise:
  const [collectionId, setCollectionId] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resolved = await params;
        if (mounted && resolved?.id) setCollectionId(resolved.id);
      } catch (e) {
        // fallback when params is not a promise
        if (mounted && (params as any)?.id) setCollectionId((params as any).id);
      }
    })();
    return () => { mounted = false; };
  }, [params]);

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [projects, setProjects] = useState<CollectionProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollectionDetails();
  }, [collectionId]);

  const fetchCollectionDetails = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      // 1. 컬렉션 정보 가져오기
      const { data: collectionData, error: collectionError } = await supabase
        .from('Collection')
        .select('*')
        .eq('collection_id', collectionId)
        .single();

      if (collectionError) throw collectionError;
      setCollection(collectionData);

      // 2. 컬렉션에 담긴 프로젝트 가져오기
      const { data: items, error: itemsError } = await supabase
        .from('CollectionItem')
        .select(`
          project_id,
          Project (
            project_id,
            title,
            thumbnail_url,
            image_url,
            likes_count,
            views_count,
            users (
              nickname,
              profile_image_url
            )
          )
        `)
        .eq('collection_id', collectionId)
        .order('added_at', { ascending: false });

      if (itemsError) throw itemsError;

      const mappedProjects = items?.map((item: any) => {
        const p = item.Project;
        if (!p) return null;
        return {
          id: p.project_id.toString(),
          title: p.title,
          urls: {
            full: p.thumbnail_url || p.image_url || '/placeholder.jpg',
            regular: p.thumbnail_url || p.image_url || '/placeholder.jpg'
          },
          user: {
            username: p.users?.nickname || 'Unknown',
            profile_image: {
              small: p.users?.profile_image_url || '/globe.svg',
              large: p.users?.profile_image_url || '/globe.svg'
            }
          },
          likes: p.likes_count || 0,
          views: p.views_count || 0
        };
      }).filter(Boolean) as CollectionProject[] || [];

      setProjects(mappedProjects);

    } catch (error) {
      console.error('컬렉션 상세 로딩 실패:', error);
      // alert('컬렉션을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async () => {
    if (!confirm("정말로 이 컬렉션을 삭제하시겠습니까? 안에 담긴 프로젝트는 삭제되지 않습니다.")) return;

    try {
      const { error } = await supabase
        .from('Collection')
        .delete()
        .eq('collection_id', collectionId);

      if (error) throw error;
      
      alert('컬렉션이 삭제되었습니다.');
      router.push('/mypage?tab=collections');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const removeProjectFromCollection = async (projectId: string) => {
     if (!confirm("이 프로젝트를 컬렉션에서 제거하시겠습니까?")) return;
     try {
        const { error } = await supabase
          .from('CollectionItem')
          .delete()
          .match({ collection_id: collectionId, project_id: projectId });
        
        if (error) throw error;

        setProjects(prev => prev.filter(p => p.id !== projectId));
     } catch (e) {
        console.error("제거 실패:", e);
        alert("제거 실패");
     }
  };

  if (loading) {
     return (
        <div className="min-h-screen flex items-center justify-center">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
     );
  }

  if (!collection) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <p className="text-gray-500 mb-4">컬렉션을 찾을 수 없습니다.</p>
            <Button onClick={() => router.back()}>돌아가기</Button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </Button>
                <div>
                     <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
                        <span className="text-sm px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                            {projects.length}
                        </span>
                     </div>
                     {collection.description && (
                         <p className="text-gray-500 mt-1">{collection.description}</p>
                     )}
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVertical size={20} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer" onClick={deleteCollection}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        컬렉션 삭제
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* 프로젝트 목록 */}
        {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map(project => (
                    <div key={project.id} className="group relative">
                        <ImageCard 
                            props={{
                                ...project,
                                description: '',
                                alt_description: '',
                                created_at: new Date().toISOString()
                            }}
                        />
                        {/* 호버 시 삭제 버튼 노출 */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                removeProjectFromCollection(project.id);
                            }}
                            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                            title="컬렉션에서 제거"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                <Folder size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">이 컬렉션에 담긴 프로젝트가 없습니다.</p>
            </div>
        )}
      </div>
    </div>
  );
}
