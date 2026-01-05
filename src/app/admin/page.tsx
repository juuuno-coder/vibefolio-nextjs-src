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

  // ê´€ë¦¬ìê°€ ?„ë‹ˆë©??‘ê·¼ ì°¨ë‹¨
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      alert('ê´€ë¦¬ì ê¶Œí•œ???„ìš”?©ë‹ˆ??');
      router.push('/');
    }
  }, [isAdmin, isAdminLoading, router]);

  // ?µê³„ ë°?ìµœê·¼ ?°ì´??ë¡œë“œ (CSR ?ˆì „)
  useEffect(() => {
    // ?´ë¼?´ì–¸???¬ì´?œì—?œë§Œ ?¤í–‰
    if (typeof window === 'undefined') return;
    if (!isAdmin) return;

    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        // ?„ë¡œ?íŠ¸ ??
        const { count: projectCount } = await supabase
          .from('Project')
          .select('*', { count: 'exact', head: true });

        // ?¬ìš©????
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // ê³µì??¬í•­ ??
        const { count: noticeCount } = await supabase
          .from('notices')
          .select('*', { count: 'exact', head: true });

        // ë¬¸ì˜?¬í•­ ??
        const { count: inquiryCount } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true });

        // FAQ ??
        const { count: faqCount } = await supabase
          .from('faqs')
          .select('*', { count: 'exact', head: true });

        // ?ì—… ??
        const { count: popupCount } = await supabase
          .from('popups')
          .select('*', { count: 'exact', head: true });

        // ìµœê·¼ ?„ë¡œ?íŠ¸
        const { data: projects } = await supabase
          .from('Project')
          .select(`
            *,
            users (username, profile_image_url)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // ë¡œì»¬?¤í† ë¦¬ì? ?°ì´??(CSR ?ˆì „) - ì±„ìš©ê³?ë°°ë„ˆ
        let recruitItems: any[] = [];
        let banners: any[] = [];
        try {
          recruitItems = JSON.parse(localStorage.getItem("recruitItems") || "[]");
          banners = JSON.parse(localStorage.getItem("banners") || "[]");
        } catch (e) {
          console.warn("localStorage ?‘ê·¼ ?¤íŒ¨:", e);
        }

        // ìµœê·¼ ë¬¸ì˜
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
        console.error('?µê³„ ë¡œë“œ ?¤íŒ¨:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [isAdmin]);

  const adminMenus = [
    {
      title: "ê³µì??¬í•­ ê´€ë¦?,
      description: "?œë¹„??ê³µì? ë°??´ë²¤???Œì‹ ?±ë¡",
      icon: Megaphone,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      path: "/admin/notices",
      count: stats.totalNotices,
    },
    {
      title: "FAQ ê´€ë¦?,
      description: "?ì£¼ ë¬»ëŠ” ì§ˆë¬¸ ?±ë¡ ë°?ê´€ë¦?,
      icon: HelpCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      path: "/admin/faqs",
      count: stats.totalFaqs,
    },
    {
      title: "?ì—… ê´‘ê³  ê´€ë¦?,
      description: "ë©”ì¸ ?˜ì´ì§€ ?ì—… ?±ë¡ ë°?ê´€ë¦?,
      icon: Megaphone,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      path: "/admin/popups",
      count: stats.totalPopups,
    },
    {
      title: "ë°°ë„ˆ ê´€ë¦?,
      description: "ë©”ì¸ ?˜ì´ì§€ ë°°ë„ˆ ?…ë¡œ??ë°?ê´€ë¦?,
      icon: ImageIcon,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      path: "/admin/banners",
      count: stats.totalBanners,
    },
    {
      title: "?„ë¡œ?íŠ¸ ê´€ë¦?,
      description: "?±ë¡???„ë¡œ?íŠ¸ ì¡°íšŒ ë°?ê´€ë¦?,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      path: "/admin/projects",
      count: stats.totalProjects,
    },
    {
      title: "ì±„ìš©/ê³µëª¨??ê´€ë¦?,
      description: "ì±„ìš©, ê³µëª¨?? ?´ë²¤??ê´€ë¦?,
      icon: Briefcase,
      color: "text-green-500",
      bgColor: "bg-green-50",
      path: "/admin/recruit",
      count: stats.totalRecruitItems,
    },
    {
      title: "ë¬¸ì˜ ê´€ë¦?,
      description: "1:1 ë¬¸ì˜ ?´ì—­ ì¡°íšŒ ë°??µë?",
      icon: MessageCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      path: "/admin/inquiries",
      count: stats.totalInquiries,
    },
    {
      title: "?¬ìš©??ê´€ë¦?,
      description: "?Œì› ?•ë³´ ì¡°íšŒ ë°?ê´€ë¦?,
      icon: Users,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      path: "/admin/users",
      count: stats.totalUsers,
    },
    {
      title: "?µê³„",
      description: "?¬ì´???µê³„ ë°?ë¶„ì„",
      icon: BarChart3,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      path: "/admin/stats",
      count: null,
    },
  ];

  // ë¡œë”© ì¤‘ì¼ ??
  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#4ACAD4] mx-auto mb-4" />
          <p className="text-gray-600">ê¶Œí•œ ?•ì¸ ì¤?..</p>
        </div>
      </div>
    );
  }

  // ê´€ë¦¬ìê°€ ?„ë‹ ??
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">?‘ê·¼ ê¶Œí•œ???†ìŠµ?ˆë‹¤</h1>
          <p className="text-gray-600 mb-4">ê´€ë¦¬ìë§??‘ê·¼?????ˆëŠ” ?˜ì´ì§€?…ë‹ˆ??</p>
          <Link href="/">
            <Button>?ˆìœ¼ë¡??Œì•„ê°€ê¸?/Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* ?¤ë” */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-[#4ACAD4]" size={32} />
              <h1 className="text-3xl font-bold text-gray-900">
                ê´€ë¦¬ì ?€?œë³´??
              </h1>
            </div>
            <p className="text-gray-600">
              ?¬ì´???„ì²´ë¥?ê´€ë¦¬í•˜ê³?ëª¨ë‹ˆ?°ë§?˜ì„¸??
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              ?¬ì´?¸ë¡œ ?Œì•„ê°€ê¸?
            </Button>
          </Link>
        </div>

        {/* ?µê³„ ì¹´ë“œ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">?„ì²´ ?„ë¡œ?íŠ¸</p>
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
                  <p className="text-sm text-gray-600 mb-1">ë¬¸ì˜ ?´ì—­</p>
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
                  <p className="text-sm text-gray-600 mb-1">ì±„ìš©/ê³µëª¨??/p>
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
                  <p className="text-sm text-gray-600 mb-1">ë°°ë„ˆ</p>
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

        {/* ê´€ë¦?ë©”ë‰´ */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ê´€ë¦?ë©”ë‰´</h2>
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

        {/* ìµœê·¼ ?œë™ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ìµœê·¼ ?„ë¡œ?íŠ¸ */}
          <Card>
            <CardHeader>
              <CardTitle>ìµœê·¼ ?±ë¡???„ë¡œ?íŠ¸</CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  ?±ë¡???„ë¡œ?íŠ¸ê°€ ?†ìŠµ?ˆë‹¤
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
                            {project.title || project.description?.substring(0, 30) || "?œëª© ?†ìŒ"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.user?.username || "?µëª…"}
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

          {/* ìµœê·¼ ë¬¸ì˜ */}
          <Card>
            <CardHeader>
              <CardTitle>ìµœê·¼ ë¬¸ì˜</CardTitle>
            </CardHeader>
            <CardContent>
              {recentInquiries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  ë¬¸ì˜ ?´ì—­???†ìŠµ?ˆë‹¤
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
