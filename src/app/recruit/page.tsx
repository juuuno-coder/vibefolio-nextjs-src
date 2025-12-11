// src/app/recruit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MainBanner } from "@/components/MainBanner";
import { Plus, Trash2, Edit, Calendar, MapPin, Award, Briefcase, DollarSign, ExternalLink, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Item {
  id: number;
  title: string;
  description: string;
  type: "job" | "contest" | "event";
  date: string;
  location?: string;
  prize?: string;
  salary?: string;
  company?: string;
  employmentType?: string;
  link?: string;
  thumbnail?: string;
}

export default function RecruitPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [banners, setBanners] = useState<number[]>([1, 2, 3]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "job" as "job" | "contest" | "event",
    date: "",
    location: "",
    prize: "",
    salary: "",
    company: "",
    employmentType: "정규직",
    link: "",
    thumbnail: "",
  });

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // users 테이블에서 role 확인
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single() as { data: { role: string } | null };
        
        if (userData?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();
  }, []);

  // 로컬 스토리지에서 항목 불러오기
  useEffect(() => {
    const savedItems = localStorage.getItem("recruitItems");
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    } else {
      // 기본 예시 데이터
      const defaultItems: Item[] = [
        {
          id: 1,
          title: "UI/UX 디자이너 채용",
          description: "스타트업에서 함께 성장할 UI/UX 디자이너를 찾습니다. Figma, Adobe XD 능숙자 우대",
          type: "job",
          date: "2025-03-31",
          location: "서울 강남구",
          company: "디자인 스튜디오",
          salary: "연봉 3,500~4,500만원",
          employmentType: "정규직",
          link: "https://example.com/job1",
        },
        {
          id: 2,
          title: "프리랜서 그래픽 디자이너 모집",
          description: "브랜딩 프로젝트를 함께할 프리랜서 디자이너를 찾습니다.",
          type: "job",
          date: "2025-02-28",
          location: "재택근무",
          company: "크리에이티브 에이전시",
          salary: "프로젝트당 200~500만원",
          employmentType: "프리랜서",
          link: "https://example.com/job2",
        },
        {
          id: 3,
          title: "AI 크리에이티브 공모전 2025",
          description: "AI를 활용한 창작물을 공모합니다. 다양한 분야의 작품을 기다립니다.",
          type: "contest",
          date: "2025-03-31",
          prize: "대상 500만원, 우수상 200만원",
          link: "https://example.com/contest1",
        },
        {
          id: 4,
          title: "디자이너 네트워킹 데이",
          description: "디자이너들과 함께하는 네트워킹 이벤트입니다. 포트폴리오 리뷰 및 커리어 상담 진행",
          type: "event",
          date: "2025-02-15",
          location: "서울 강남구 코엑스",
        },
        {
          id: 5,
          title: "모션 그래픽 디자이너 채용",
          description: "영상 제작 스튜디오에서 모션 그래픽 디자이너를 채용합니다. After Effects, Cinema 4D 필수",
          type: "job",
          date: "2025-04-15",
          location: "서울 마포구",
          company: "비디오 프로덕션",
          salary: "연봉 4,000~5,500만원",
          employmentType: "정규직",
          link: "https://example.com/job3",
        },
        {
          id: 6,
          title: "브랜드 디자인 공모전",
          description: "새로운 브랜드 아이덴티티 디자인 공모전. 실제 브랜드 론칭 기회 제공",
          type: "contest",
          date: "2025-03-20",
          prize: "대상 1,000만원 + 브랜드 론칭 기회",
          link: "https://example.com/contest2",
        },
      ];
      setItems(defaultItems);
      localStorage.setItem("recruitItems", JSON.stringify(defaultItems));
    }
  }, []);

  // 항목 추가/수정
  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.date) {
      alert("제목, 설명, 날짜는 필수 항목입니다.");
      return;
    }

    if (editingItem) {
      // 수정
      const updatedItems = items.map((item) =>
        item.id === editingItem.id
          ? { ...formData, id: editingItem.id }
          : item
      );
      setItems(updatedItems);
      localStorage.setItem("recruitItems", JSON.stringify(updatedItems));
    } else {
      // 추가
      const newItem: Item = {
        ...formData,
        id: Date.now(),
      };
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      localStorage.setItem("recruitItems", JSON.stringify(updatedItems));
    }

    // 폼 초기화
    setFormData({
      title: "",
      description: "",
      type: "job",
      date: "",
      location: "",
      prize: "",
      salary: "",
      company: "",
      employmentType: "정규직",
      link: "",
      thumbnail: "",
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  // 항목 삭제
  const handleDelete = (id: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      const updatedItems = items.filter((item) => item.id !== id);
      setItems(updatedItems);
      localStorage.setItem("recruitItems", JSON.stringify(updatedItems));
    }
  };

  // 항목 수정 시작
  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      type: item.type,
      date: item.date,
      location: item.location || "",
      prize: item.prize || "",
      salary: item.salary || "",
      company: item.company || "",
      employmentType: item.employmentType || "정규직",
      link: item.link || "",
      thumbnail: item.thumbnail || "",
    });
    setIsDialogOpen(true);
  };

  // 다이얼로그 닫을 때 초기화
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      type: "job",
      date: "",
      location: "",
      prize: "",
      salary: "",
      company: "",
      employmentType: "정규직",
      link: "",
      thumbnail: "",
    });
  };

  // 자세히 보기 클릭 핸들러
  const handleViewDetail = (item: Item) => {
    if (item.link && item.link.startsWith('http')) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    } else {
      alert('링크가 등록되지 않았습니다. 관리자에게 문의해주세요.');
    }
  };

  // D-day 계산
  const getDday = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '마감';
    if (diff === 0) return 'D-Day';
    return `D-${diff}`;
  };

  const jobs = items.filter((e) => e.type === "job");
  const contests = items.filter((e) => e.type === "contest");
  const events = items.filter((e) => e.type === "event");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 배너 섹션 */}
      <div className="w-full px-0 py-3 bg-white">
        <MainBanner loading={false} gallery={banners} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              연결 - 채용 · 공모전 · 이벤트
            </h1>
            <p className="text-gray-600">
              크리에이터들을 위한 채용 정보, 공모전, 이벤트를 확인하세요
            </p>
          </div>
          
          {/* 관리자만 새 항목 추가 버튼 표시 */}
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#4ACAD4] hover:bg-[#41a3aa]"
                  onClick={() => handleDialogClose()}
                >
                  <Plus size={18} className="mr-2" />
                  새 항목 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "항목 수정" : "새 항목 추가"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      유형
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as "job" | "contest" | "event",
                        })
                      }
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="job">채용</option>
                      <option value="contest">공모전</option>
                      <option value="event">이벤트</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 *
                    </label>
                    <Input
                      placeholder="제목을 입력하세요"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      설명 *
                    </label>
                    <Textarea
                      placeholder="설명을 입력하세요"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                    />
                  </div>

                  {/* 채용 전용 필드 */}
                  {formData.type === "job" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          회사명
                        </label>
                        <Input
                          placeholder="회사명을 입력하세요"
                          value={formData.company}
                          onChange={(e) =>
                            setFormData({ ...formData, company: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            고용 형태
                          </label>
                          <select
                            value={formData.employmentType}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                employmentType: e.target.value,
                              })
                            }
                            className="w-full border rounded-md px-3 py-2"
                          >
                            <option value="정규직">정규직</option>
                            <option value="계약직">계약직</option>
                            <option value="프리랜서">프리랜서</option>
                            <option value="인턴">인턴</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            급여
                          </label>
                          <Input
                            placeholder="예: 연봉 3,500~4,500만원"
                            value={formData.salary}
                            onChange={(e) =>
                              setFormData({ ...formData, salary: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* 공모전 전용 필드 */}
                  {formData.type === "contest" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상금/혜택
                      </label>
                      <Input
                        placeholder="예: 대상 500만원"
                        value={formData.prize}
                        onChange={(e) =>
                          setFormData({ ...formData, prize: e.target.value })
                        }
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        마감일/날짜 *
                      </label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        장소
                      </label>
                      <Input
                        placeholder="장소를 입력하세요"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      바로가기 링크 (필수)
                    </label>
                    <Input
                      placeholder="https://example.com"
                      value={formData.link}
                      onChange={(e) =>
                        setFormData({ ...formData, link: e.target.value })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      채용/공모전/이벤트 상세 페이지 URL을 입력해주세요
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={handleDialogClose}>
                      취소
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="bg-[#4ACAD4] hover:bg-[#41a3aa]"
                    >
                      {editingItem ? "수정" : "추가"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* 탭 */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">전체 ({items.length})</TabsTrigger>
            <TabsTrigger value="job">채용 ({jobs.length})</TabsTrigger>
            <TabsTrigger value="contest">공모전 ({contests.length})</TabsTrigger>
            <TabsTrigger value="event">이벤트 ({events.length})</TabsTrigger>
          </TabsList>

          {/* 전체 */}
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetail={handleViewDetail}
                  isAdmin={isAdmin}
                  getDday={getDday}
                />
              ))}
            </div>
            {items.length === 0 && <EmptyState />}
          </TabsContent>

          {/* 채용 */}
          <TabsContent value="job">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetail={handleViewDetail}
                  isAdmin={isAdmin}
                  getDday={getDday}
                />
              ))}
            </div>
            {jobs.length === 0 && <EmptyState />}
          </TabsContent>

          {/* 공모전 */}
          <TabsContent value="contest">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contests.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetail={handleViewDetail}
                  isAdmin={isAdmin}
                  getDday={getDday}
                />
              ))}
            </div>
            {contests.length === 0 && <EmptyState />}
          </TabsContent>

          {/* 이벤트 */}
          <TabsContent value="event">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetail={handleViewDetail}
                  isAdmin={isAdmin}
                  getDday={getDday}
                />
              ))}
            </div>
            {events.length === 0 && <EmptyState />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 항목 카드 컴포넌트
function ItemCard({
  item,
  onEdit,
  onDelete,
  onViewDetail,
  isAdmin,
  getDday,
}: {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (id: number) => void;
  onViewDetail: (item: Item) => void;
  isAdmin: boolean;
  getDday: (date: string) => string;
}) {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case "job":
        return { label: "채용", color: "bg-blue-100 text-blue-700", icon: Briefcase };
      case "contest":
        return { label: "공모전", color: "bg-purple-100 text-purple-700", icon: Award };
      case "event":
        return { label: "이벤트", color: "bg-green-100 text-green-700", icon: Calendar };
      default:
        return { label: "기타", color: "bg-gray-100 text-gray-700", icon: Calendar };
    }
  };

  const typeInfo = getTypeInfo(item.type);
  const dday = getDday(item.date);
  const isExpired = dday === '마감';

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-300 ${isExpired ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {item.employmentType && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {item.employmentType}
                </span>
              )}
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                isExpired 
                  ? 'bg-gray-200 text-gray-500' 
                  : dday === 'D-Day' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-[#4ACAD4]/20 text-[#4ACAD4]'
              }`}>
                {dday}
              </span>
            </div>
            <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
            {item.company && (
              <p className="text-sm text-gray-600 mt-1">{item.company}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {item.description}
        </p>
        <Separator className="my-4" />
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span>{new Date(item.date).toLocaleDateString("ko-KR")}</span>
          </div>
          {item.location && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" />
              <span>{item.location}</span>
            </div>
          )}
          {item.salary && (
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-gray-400" />
              <span>{item.salary}</span>
            </div>
          )}
          {item.prize && (
            <div className="flex items-center gap-2">
              <Award size={16} className="text-gray-400" />
              <span>{item.prize}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="default"
            size="sm"
            className="flex-1 bg-[#4ACAD4] hover:bg-[#41a3aa]"
            onClick={() => onViewDetail(item)}
            disabled={isExpired}
          >
            <ExternalLink size={16} className="mr-1" />
            자세히 보기
          </Button>
          {/* 관리자만 수정/삭제 버튼 표시 */}
          {isAdmin && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 빈 상태 컴포넌트
function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-lg">등록된 항목이 없습니다.</p>
      <p className="text-sm mt-2">관리자가 새 항목을 추가하면 여기에 표시됩니다.</p>
    </div>
  );
}
