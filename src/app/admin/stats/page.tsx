// src/app/admin/stats/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingUp,
  Eye,
  Heart,
  Users,
  FileText,
  MessageCircle,
  Briefcase,
  Image as ImageIcon,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";

interface Stats {
  totalProjects: number;
  totalUsers: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalBanners: number;
  recentProjects: any[];
  topProjects: any[];
  categoryStats: { name: string; count: number }[];
}

export default function AdminStatsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalUsers: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
    totalBanners: 0,
    recentProjects: [],
    topProjects: [],
    categoryStats: [],
  });
  const [loading, setLoading] = useState(true);

  // 통계 로드
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      // 프로젝트 통계
      const { data: projects, count: projectCount } = await supabase
        .from("Project")
        .select("*, Category(name)", { count: "exact" });

      // 사용자 수
      const { count: userCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // 좋아요 수
      const { count: likeCount } = await supabase
        .from("Like")
        .select("*", { count: "exact", head: true });

      // 댓글 수
      const { count: commentCount } = await supabase
        .from("Comment")
        .select("*", { count: "exact", head: true });

      // 배너 수
      const { count: bannerCount } = await supabase
        .from("Banner")
        .select("*", { count: "exact", head: true });

      // 총 조회수 계산
      const totalViews = (projects || []).reduce(
        (sum, p) => sum + (p.views || 0),
        0
      );

      // 최근 프로젝트 5개
      const { data: recentProjects } = await supabase
        .from("Project")
        .select("*, users(nickname)")
        .order("created_at", { ascending: false })
        .limit(5);

      // 인기 프로젝트 (조회수 기준)
      const { data: topProjects } = await supabase
        .from("Project")
        .select("*, users(nickname)")
        .order("views", { ascending: false })
        .limit(5);

      // 카테고리별 통계
      const categoryMap: { [key: string]: number } = {};
      (projects || []).forEach((p) => {
        const catName = p.Category?.name || "미분류";
        categoryMap[catName] = (categoryMap[catName] || 0) + 1;
      });
      const categoryStats = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalProjects: projectCount || 0,
        totalUsers: userCount || 0,
        totalLikes: likeCount || 0,
        totalViews,
        totalComments: commentCount || 0,
        totalBanners: bannerCount || 0,
        recentProjects: recentProjects || [],
        topProjects: topProjects || [],
        categoryStats,
      });
    } catch (error) {
      console.error("통계 로드 실패:", error);
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
      loadStats();
    }
  }, [isAdmin, adminLoading, router, loadStats]);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              관리자 대시보드로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">통계</h1>
            <p className="text-gray-600">사이트 전체 통계를 확인하세요</p>
          </div>
          <Button onClick={loadStats} variant="outline" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            새로고침
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={48} />
          </div>
        ) : (
          <>
            {/* 주요 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    전체 프로젝트
                  </CardTitle>
                  <FileText className="text-blue-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.totalProjects.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">등록된 프로젝트 수</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    전체 회원
                  </CardTitle>
                  <Users className="text-purple-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">가입한 회원 수</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    총 조회수
                  </CardTitle>
                  <Eye className="text-green-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.totalViews.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    모든 프로젝트의 조회수 합계
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    총 좋아요
                  </CardTitle>
                  <Heart className="text-red-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.totalLikes.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    모든 프로젝트의 좋아요 합계
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    총 댓글
                  </CardTitle>
                  <MessageCircle className="text-orange-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.totalComments.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">전체 댓글 수</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    등록된 배너
                  </CardTitle>
                  <ImageIcon className="text-cyan-500" size={20} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.totalBanners.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">활성 배너 수</p>
                </CardContent>
              </Card>
            </div>

            {/* 상세 통계 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 평균 통계 */}
              <Card>
                <CardHeader>
                  <CardTitle>평균 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                      <span className="text-gray-700">프로젝트당 평균 조회수</span>
                      <span className="font-bold text-gray-900">
                        {stats.totalProjects > 0
                          ? (stats.totalViews / stats.totalProjects).toFixed(1)
                          : "0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                      <span className="text-gray-700">프로젝트당 평균 좋아요</span>
                      <span className="font-bold text-gray-900">
                        {stats.totalProjects > 0
                          ? (stats.totalLikes / stats.totalProjects).toFixed(1)
                          : "0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                      <span className="text-gray-700">프로젝트당 평균 댓글</span>
                      <span className="font-bold text-gray-900">
                        {stats.totalProjects > 0
                          ? (stats.totalComments / stats.totalProjects).toFixed(1)
                          : "0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                      <span className="text-gray-700">회원당 평균 프로젝트</span>
                      <span className="font-bold text-gray-900">
                        {stats.totalUsers > 0
                          ? (stats.totalProjects / stats.totalUsers).toFixed(1)
                          : "0"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 카테고리별 통계 */}
              <Card>
                <CardHeader>
                  <CardTitle>카테고리별 프로젝트</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.categoryStats.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      데이터가 없습니다
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stats.categoryStats.slice(0, 8).map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {cat.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {cat.count}개
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                style={{
                                  width: `${
                                    (cat.count / stats.totalProjects) * 100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 인기/최근 프로젝트 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 인기 프로젝트 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-orange-500" />
                    인기 프로젝트 (조회수 기준)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.topProjects.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      프로젝트가 없습니다
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stats.topProjects.map((project, idx) => (
                        <div
                          key={project.project_id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-lg font-bold text-gray-400 w-6">
                            {idx + 1}
                          </span>
                          <img
                            src={project.thumbnail_url || "/globe.svg"}
                            alt={project.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {project.title || "제목 없음"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {project.users?.nickname || "익명"} ·{" "}
                              <Eye size={12} className="inline" />{" "}
                              {(project.views || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 최근 프로젝트 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText size={20} className="text-blue-500" />
                    최근 등록 프로젝트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentProjects.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      프로젝트가 없습니다
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentProjects.map((project) => (
                        <div
                          key={project.project_id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <img
                            src={project.thumbnail_url || "/globe.svg"}
                            alt={project.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {project.title || "제목 없음"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {project.users?.nickname || "익명"} ·{" "}
                              {new Date(project.created_at).toLocaleDateString(
                                "ko-KR"
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
