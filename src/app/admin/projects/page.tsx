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
  Check,
  RefreshCw,
  CheckSquare,
  Square,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";

// 카테고리 목록
const CATEGORIES = [
  { id: 1, name: "전체" },
  { id: 2, name: "AI" },
  { id: 3, name: "비디오/영상" },
  { id: 4, name: "그래픽 디자인" },
  { id: 5, name: "브랜딩" },
  { id: 6, name: "일러스트" },
  { id: 7, name: "3D" },
  { id: 8, name: "사진" },
  { id: 9, name: "UI/UX" },
  { id: 10, name: "제품 디자인" },
  { id: 11, name: "타이포그래피" },
  { id: 12, name: "공예" },
  { id: 13, name: "파인아트" },
];

export default function AdminProjectsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

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

  // 프로젝트 선택 토글
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map(p => p.project_id)));
    }
  };

  // 선택된 프로젝트 카테고리 일괄 변경
  const handleBatchCategoryChange = async () => {
    if (selectedIds.size === 0) {
      alert("프로젝트를 선택해주세요.");
      return;
    }
    if (!selectedCategory) {
      alert("변경할 카테고리를 선택해주세요.");
      return;
    }

    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/projects/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ category_id: selectedCategory })
        })
      );

      await Promise.all(promises);
      
      alert(`${selectedIds.size}개 프로젝트의 카테고리가 변경되었습니다.`);
      setSelectedIds(new Set());
      setSelectedCategory(null);
      loadProjects();
    } catch (error) {
      console.error("카테고리 변경 실패:", error);
      alert("카테고리 변경에 실패했습니다.");
    } finally {
      setUpdating(false);
    }
  };

  // 프로젝트 삭제
  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 프로젝트를 삭제하시겠습니까?")) return;

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

  // 선택된 프로젝트 일괄 삭제
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      alert("프로젝트를 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}개 프로젝트를 모두 삭제하시겠습니까?`)) return;

    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/projects/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        })
      );

      await Promise.all(promises);
      
      alert(`${selectedIds.size}개 프로젝트가 삭제되었습니다.`);
      setSelectedIds(new Set());
      loadProjects();
    } catch (error) {
      console.error("일괄 삭제 실패:", error);
      alert("일괄 삭제에 실패했습니다.");
    } finally {
      setUpdating(false);
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

        {/* 검색 및 일괄 작업 */}
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

          {/* 일괄 작업 바 */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-medium text-blue-700">
                {selectedIds.size}개 선택됨
              </span>
              
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">카테고리 선택</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              
              <Button 
                onClick={handleBatchCategoryChange}
                disabled={updating || !selectedCategory}
                size="sm"
              >
                {updating ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                카테고리 변경
              </Button>
              
              <Button 
                variant="destructive"
                onClick={handleBatchDelete}
                disabled={updating}
                size="sm"
              >
                선택 삭제
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                size="sm"
              >
                선택 해제
              </Button>
            </div>
          )}
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
            <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
              {selectedIds.size === filteredProjects.length ? (
                <><CheckSquare size={16} className="mr-2" />전체 해제</>
              ) : (
                <><Square size={16} className="mr-2" />전체 선택</>
              )}
            </Button>
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
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors cursor-pointer ${
                      selectedIds.has(project.project_id) 
                        ? "bg-blue-50 border-2 border-blue-300" 
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                    onClick={() => toggleSelect(project.project_id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* 체크박스 */}
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        selectedIds.has(project.project_id) 
                          ? "bg-blue-500 border-blue-500 text-white" 
                          : "border-gray-300"
                      }`}>
                        {selectedIds.has(project.project_id) && <Check size={14} />}
                      </div>

                      {/* 썸네일 */}
                      <img
                        src={project.thumbnail_url || project.image_url || "/globe.svg"}
                        alt={project.title || "프로젝트"}
                        className="w-20 h-20 object-cover rounded"
                      />
                      
                      {/* 정보 */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {project.title || "제목 없음"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                          {project.content_text || "설명 없음"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>@{project.User?.username || "익명"}</span>
                          <span>조회 {(project.views_count || project.views || 0).toLocaleString()}</span>
                          <span>좋아요 {(project.likes_count || project.likes || 0).toLocaleString()}</span>
                          <span>
                            {new Date(project.created_at).toLocaleDateString("ko-KR")}
                          </span>
                          {project.Category && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {project.Category.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/project/${project.project_id}`, "_blank")}
                      >
                        <Eye size={16} className="mr-1" />
                        보기
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
      </div>
    </div>
  );
}
