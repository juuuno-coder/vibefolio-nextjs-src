// src/app/admin/projects/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  Trash2, 
  Search, 
  ArrowLeft, 
  RefreshCw,
  Loader2,
  Settings
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { ProjectDetailModalV2 } from "@/components/ProjectDetailModalV2";
import { GENRE_CATEGORIES, FIELD_CATEGORIES, GENRE_TO_CATEGORY_ID } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";



const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '');
};

export default function AdminProjectsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Metadata Edit State
  const [metadataEditOpen, setMetadataEditOpen] = useState(false);
  const [metadataTarget, setMetadataTarget] = useState<any>(null);
  const [editGenres, setEditGenres] = useState<string[]>([]);
  const [editFields, setEditFields] = useState<string[]>([]);

  // Open Metadata Editor
  const openMetadataEditor = (project: any) => {
    setMetadataTarget(project);
    try {
        const custom = typeof project.custom_data === 'string' ? JSON.parse(project.custom_data) : project.custom_data || {};
        setEditGenres(custom.genres || []);
        setEditFields(custom.fields || []);
    } catch {
        setEditGenres([]);
        setEditFields([]);
    }
    setMetadataEditOpen(true);
  };

  // Save Metadata
  const saveMetadata = async () => {
    if (!metadataTarget) return;
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Preserve existing custom_data
        let existingCustom = {};
        try {
            existingCustom = typeof metadataTarget.custom_data === 'string' ? JSON.parse(metadataTarget.custom_data) : metadataTarget.custom_data || {};
        } catch {}

        const newCustomData = {
            ...existingCustom,
            genres: editGenres,
            fields: editFields
        };

        // [Sync] Update core columns based on primary selection
        const primaryGenre = editGenres[0];
        const primaryField = editFields[0];
        
        const payload: any = { custom_data: newCustomData };
        
        if (primaryGenre && GENRE_TO_CATEGORY_ID[primaryGenre]) {
            payload.category_id = GENRE_TO_CATEGORY_ID[primaryGenre];
        }
        
        if (primaryField) {
            payload.field = primaryField;
        }

        const res = await fetch(`/api/projects/${metadataTarget.project_id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Metadata update failed");

        alert("메타데이터가 수정되었습니다.");
        setMetadataEditOpen(false);
        loadProjects();
    } catch (error) {
        console.error("메타데이터 수정 실패:", error);
        alert("수정에 실패했습니다.");
    }
  };

  // 프로젝트 로드
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects?limit=100');
      const data = await res.json();
      
      if (res.ok && data.projects) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("프로젝트 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      alert("관리자 권한이 필요합니다.");
      router.push("/");
      return;
    }
    if (isAdmin) {
      loadProjects();
    }
  }, [isAdmin, adminLoading, router, loadProjects]);

  // 프로젝트 삭제
  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 프로젝트를 삭제하시겠습니까?\n(확인 시 DB에서 완전히 삭제되지 않고 숨김 처리됩니다)")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (res.ok) {
        alert("프로젝트가 삭제되었습니다.");
        loadProjects();
      } else {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("프로젝트 삭제 실패:", error);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const title = project.title?.toLowerCase() || "";
    const content = project.content_text?.toLowerCase() || "";
    const username = project.User?.username?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return title.includes(term) || content.includes(term) || username.includes(term);
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            관리자 대시보드로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            프로젝트 관리
          </h1>
          <p className="text-gray-600">
            등록된 모든 프로젝트를 조회하고 관리하세요
          </p>
        </div>

        {/* 검색 */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-lg px-4 py-2 bg-white flex-1">
              <Search size={20} className="text-gray-400 mr-2" />
              <Input
                placeholder="제목, 내용, 작성자로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-none focus-visible:ring-0"
              />
            </div>
            <Button onClick={loadProjects} variant="outline">
              <RefreshCw size={16} className="mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">전체 프로젝트</p>
              <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">검색 결과</p>
              <p className="text-3xl font-bold text-gray-900">{filteredProjects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">총 조회수</p>
              <p className="text-3xl font-bold text-gray-900">
                {projects.reduce((sum, p) => sum + (p.views_count || p.views || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">총 좋아요</p>
              <p className="text-3xl font-bold text-gray-900">
                {projects.reduce((sum, p) => sum + (p.likes_count || p.likes || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 프로젝트 목록 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>프로젝트 목록 ({filteredProjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : filteredProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                {searchTerm ? "검색 결과가 없습니다" : "등록된 프로젝트가 없습니다"}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.project_id}
                    className="flex items-center justify-between p-4 rounded-lg transition-colors bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* 썸네일 */}
                      <img
                        src={project.thumbnail_url || project.image_url || "/globe.svg"}
                        alt={project.title || "프로젝트"}
                        className="w-28 aspect-[4/3] object-cover rounded bg-slate-100"
                      />
                      
                      {/* 정보 */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {project.title || "제목 없음"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                          {project.summary || project.description || stripHtml(project.content_text) || "설명 없음"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>@{project.User?.username || "익명"}</span>
                          <span>조회 {(project.views_count || project.views || 0).toLocaleString()}</span>
                          <span>좋아요 {(project.likes_count || project.likes || 0).toLocaleString()}</span>
                          <span>
                            {new Date(project.created_at).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProject({
                             id: project.project_id.toString(),
                             urls: { 
                               full: project.thumbnail_url || project.image_url || "/globe.svg", 
                               regular: project.thumbnail_url || project.image_url || "/globe.svg" 
                             },
                             user: {
                               username: project.User?.username || "익명",
                               profile_image: { 
                                 small: project.User?.avatar_url || "/globe.svg", 
                                 large: project.User?.avatar_url || "/globe.svg" 
                               }
                             },
                             likes: project.likes_count || project.likes || 0,
                             views: project.views_count || project.views || 0,
                             title: project.title,
                             description: project.content_text,
                             summary: project.summary,
                             alt_description: project.title,
                             created_at: project.created_at,
                             width: 1200, 
                             height: 800,
                             userId: project.user_id,
                             rendering_type: project.rendering_type
                          });
                          setDetailModalOpen(true);
                        }}
                      >
                        <Eye size={16} className="mr-1" />
                        보기
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            openMetadataEditor(project);
                        }}
                        className="text-gray-500 hover:text-gray-900"
                        title="메타데이터 관리"
                      >
                        <Settings size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(project.project_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <ProjectDetailModalV2
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          project={selectedProject}
        />

        <Dialog open={metadataEditOpen} onOpenChange={setMetadataEditOpen}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle>프로젝트 메타데이터 수정 ({metadataTarget?.title})</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                  <Label>장르 (Genres - 최대 5개)</Label>
                  <div className="flex flex-wrap gap-2">
                      {GENRE_CATEGORIES.map(g => (
                          <button
                              key={g.id}
                              onClick={() => setEditGenres(prev => {
                                  if (prev.includes(g.id)) return prev.filter(x => x !== g.id);
                                  if (prev.length >= 5) { alert('장르는 최대 5개까지 선택 가능합니다.'); return prev; }
                                  return [...prev, g.id];
                              })}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                  editGenres.includes(g.id) 
                                  ? "bg-green-100 border-green-500 text-green-700" 
                                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                          >
                              {g.label}
                          </button>
                      ))}
                  </div>
              </div>
              
              <div className="space-y-2">
                  <Label>산업 분야 (Fields - 최대 3개)</Label>
                  <div className="flex flex-wrap gap-2">
                      {FIELD_CATEGORIES.map(f => (
                          <button
                              key={f.id}
                              onClick={() => setEditFields(prev => {
                                  if (prev.includes(f.id)) return prev.filter(x => x !== f.id);
                                  if (prev.length >= 3) { alert('분야는 최대 3개까지 선택 가능합니다.'); return prev; }
                                  return [...prev, f.id];
                              })}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                  editFields.includes(f.id) 
                                  ? "bg-blue-100 border-blue-500 text-blue-700" 
                                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                          >
                              {f.label}
                          </button>
                      ))}
                  </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMetadataEditOpen(false)}>취소</Button>
              <Button onClick={saveMetadata}>저장하기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
