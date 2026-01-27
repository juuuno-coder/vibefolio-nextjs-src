"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@/components/FaIcon";
import { 
  faChartBar, 
  faImage, 
  faUsers, 
  faBriefcase, 
  faCommentDots, 
  faFileAlt, 
  faBullhorn, 
  faQuestionCircle, 
  faTachometerAlt, 
  faBell, 
  faCog, 
  faArrowLeft, 
  faChevronRight, 
  faTv 
} from "@fortawesome/free-solid-svg-icons";

const menuItems = [
  {
    title: "대시보드",
    path: "/admin",
    icon: faTachometerAlt,
    color: "text-slate-600"
  },
  {
    title: "배너 관리",
    path: "/admin/banners",
    icon: faImage,
    color: "text-purple-500"
  },
  {
    title: "프로젝트 관리",
    path: "/admin/projects",
    icon: faFileAlt,
    color: "text-blue-500"
  },
  {
    title: "채용/공모전 관리",
    path: "/admin/recruit",
    icon: faBriefcase,
    color: "text-green-500"
  },
  {
    title: "공지사항 관리",
    path: "/admin/notices",
    icon: faBullhorn,
    color: "text-amber-500"
  },
  {
    title: "FAQ 관리",
    path: "/admin/faqs",
    icon: faQuestionCircle,
    color: "text-cyan-500"
  },
  {
    title: "문의 내역",
    path: "/admin/inquiries",
    icon: faCommentDots,
    color: "text-orange-500"
  },
  {
    title: "사용자 관리",
    path: "/admin/users",
    icon: faUsers,
    color: "text-pink-500"
  },
  {
    title: "방문 통계",
    path: "/admin/stats",
    icon: faChartBar,
    color: "text-indigo-500"
  },
  {
    title: "설정 관리",
    path: "/admin/settings",
    icon: faCog,
    color: "text-slate-600"
  },

];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 z-[110] flex flex-col">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-xl italic">V</span>
          </div>
          <span className="font-black text-lg tracking-tighter">VIBEFOLIO</span>
          <span className="text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded ml-1">ADMIN</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={item.icon} className={`w-5 h-5 ${isActive ? "text-white" : item.color}`} />
                <span className="font-medium text-sm">{item.title}</span>
              </div>
              {isActive && <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <Link 
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all font-medium text-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-[18px] h-[18px]" />
          사이트로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
