// src/app/admin/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Image as ImageIcon,
  Users,
  Briefcase,
  MessageCircle,
  FileText,
  Settings,
  BarChart3,
  Shield,
  Eye,
  Trash2,
  AlertCircle,
  Loader2,
  Megaphone,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading, userId } = useAdmin();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalInquiries: 0,
    totalRecruitItems: 0,
    totalBanners: 0,
    totalNotices: 0,
    totalFaqs: 0,
    totalPopups: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);

  // 관리자가 아니면 접근 차단
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      alert('관리자 권한이 필요합니다.');
      router.push('/');
    }
  }, [isAdmin, isAdminLoading, router]);

  // 통계 및 최근 데이터 로드
  useEffect(() => {
    const loadStats = async () => {
      if (!isAdmin) return;

      setIsLoadingStats(true);
      try {
        // 프로젝트 수
        const { count: projectCount } = await supabase
          .from('Project')
          .select('*', { count: 'exact', head: true });

        // 사용자 수
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // 공지사항 수
        const { count: noticeCount } = await supabase
          .from('notices')
          .select('*', { count: 'exact', head: true });

        // 문의사항 수
        const { count: inquiryCount } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true });

        // FAQ 수
        const { count: faqCount } = await supabase
          .from('faqs')
          .select('*', { count: 'exact', head: true });

        // 팝업 수
        const { count: popupCount } = await supabase
          .from('popups')
          .select('*', { count: 'exact', head: true });

        // 최근 프로젝트
        const { data: projects } = await supabase
          .from('Project')
          .select(`
            *,
            users (nickname, profile_image_url)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // 로컬스토리지 데이터 (채용, 배너) - 채용과 배너는 아직 DB화 안됨?
        const recruitItems = JSON.parse(localStorage.getItem("recruitItems") || "[]");
        const banners = JSON.parse(localStorage.getItem("banners") || "[]");

        // 최근 문의
        const { data: recentInqs } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentInquiries(recentInqs || []);

        setStats({
          totalProjects: projectCount || 0,
          totalUsers: userCount || 0,
          totalInquiries: inquiryCount || 0,
          totalRecruitItems: recruitItems.length,
          totalBanners: banners.length,
          totalNotices: noticeCount || 0,
          totalFaqs: faqCount || 0,
          totalPopups: popupCount || 0,
        });

        setRecentProjects(projects || []);
      } catch (error) {
        console.error('통계 로드 실패:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [isAdmin]);

  const adminMenus = [
    {
      title: "공지사항 관리",
      description: "서비스 공지 및 이벤트 소식 등록",
      icon: Megaphone,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      path: "/admin/notices",
      count: stats.totalNotices,
    },
    {
      title: "FAQ 관리",
      description: "자주 묻는 질문 등록 및 관리",
      icon: HelpCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      path: "/admin/faqs",
      count: stats.totalFaqs,
    },
    {
      title: "팝업 광고 관리",
      description: "메인 페이지 팝업 등록 및 관리",
      icon: Megaphone,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      path: "/admin/popups",
      count: stats.totalPopups,
    },
    {
      title: "배너 관리",
      description: "메인 페이지 배너 업로드 및 관리",
      icon: ImageIcon,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      path: "/admin/banners",
      count: stats.totalBanners,
    },
    {
      title: "프로젝트 관리",
      description: "등록된 프로젝트 조회 및 관리",
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      path: "/admin/projects",
      count: stats.totalProjects,
    },
    {
      title: "채용/공모전 관리",
      description: "채용, 공모전, 이벤트 관리",
      icon: Briefcase,
      color: "text-green-500",
      bgColor: "bg-green-50",
      path: "/admin/recruit",
      count: stats.totalRecruitItems,
    },
    {
      title: "문의 관리",
      description: "1:1 문의 내역 조회 및 답변",
      icon: MessageCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      path: "/admin/inquiries",
      count: stats.totalInquiries,
    },
    {
      title: "사용자 관리",
      description: "회원 정보 조회 및 관리",
      icon: Users,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      path: "/admin/users",
      count: stats.totalUsers,
    },
    {
      title: "통계",
      description: "사이트 통계 및 분석",
      icon: BarChart3,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      path: "/admin/stats",
      count: null,
    },
  ];

  // 로딩 중일 때
  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#4ACAD4] mx-auto mb-4" />
          <p className="text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 관리자가 아닐 때
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
          <Link href="/">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-[#4ACAD4]" size={32} />
              <h1 className="text-3xl font-bold text-gray-900">
                관리자 대시보드
              </h1>
            </div>
            <p className="text-gray-600">
              사이트 전체를 관리하고 모니터링하세요
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              사이트로 돌아가기
            </Button>
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">전체 프로젝트</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalProjects}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <FileText className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">문의 내역</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalInquiries}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <MessageCircle className="text-orange-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">채용/공모전</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalRecruitItems}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <Briefcase className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">배너</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalBanners}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <ImageIcon className="text-purple-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 관리 메뉴 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">관리 메뉴</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminMenus.map((menu, index) => (
              <Link href={menu.path} key={index}>
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`${menu.bgColor} p-3 rounded-lg`}>
                        <menu.icon className={menu.color} size={24} />
                      </div>
                      {menu.count !== null && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                          {menu.count}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-4">{menu.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{menu.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 프로젝트 */}
          <Card>
            <CardHeader>
              <CardTitle>최근 등록된 프로젝트</CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  등록된 프로젝트가 없습니다
                </p>
              ) : (
                <div className="space-y-3">
                  {recentProjects.map((project, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={project.urls?.regular || "/globe.svg"}
                          alt={project.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {project.title || project.description?.substring(0, 30) || "제목 없음"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.user?.username || "익명"}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 문의 */}
          <Card>
            <CardHeader>
              <CardTitle>최근 문의</CardTitle>
            </CardHeader>
            <CardContent>
              {recentInquiries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  문의 내역이 없습니다
                </p>
              ) : (
                <div className="space-y-3">
                  {recentInquiries.map((inquiry, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">
                          {inquiry.projectTitle}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(inquiry.date).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {inquiry.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
