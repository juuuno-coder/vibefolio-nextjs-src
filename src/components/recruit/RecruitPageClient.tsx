// src/app/recruit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Trash2, Edit, Calendar, MapPin, Award, Briefcase, DollarSign, ExternalLink, Clock, Sparkles, Loader2, Eye, ChevronRight, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";


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
  is_approved?: boolean;
  is_active?: boolean;
  views_count?: number;
  // 추가 필드
  application_target?: string;
  sponsor?: string;
  total_prize?: string;
  first_prize?: string;
  start_date?: string;
  category_tags?: string;
  banner_image_url?: string;
}

export default function RecruitPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [banners, setBanners] = useState<number[]>([1, 2, 3]);
  const [isExtracting, setIsExtracting] = useState(false);
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
    // 추가 상세 정보 필드
    application_target: "",
    sponsor: "",
    total_prize: "",
    first_prize: "",
    start_date: "",
    category_tags: "",
    banner_image_url: ""
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

  // 데이터베이스에서 항목 불러오기
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      // Supabase에서 승인되고 활성화된 항목만 가져오기
      const { data, error } = await supabase
        .from('recruit_items')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) {
        console.error('Failed to load recruit items:', error);
        // 에러 발생 시 기본 데이터 사용
        loadDefaultItems();
        return;
      }

      if (data && data.length > 0) {
        // DB 데이터를 Item 형식으로 변환
        const formattedItems: Item[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type as "job" | "contest" | "event",
          date: item.date,
          location: item.location || undefined,
          prize: item.prize || undefined,
          salary: item.salary || undefined,
          company: item.company || undefined,
          employmentType: item.employment_type || undefined,
          link: item.link || undefined,
          thumbnail: item.thumbnail || undefined,
          views_count: item.views_count || 0,
          // 추가 필드 매핑
          application_target: item.application_target || undefined,
          sponsor: item.sponsor || undefined,
          total_prize: item.total_prize || undefined,
          first_prize: item.first_prize || undefined,
          start_date: item.start_date || undefined,
          category_tags: item.category_tags || undefined,
          banner_image_url: item.banner_image_url || undefined,
        }));
        setItems(formattedItems);
      } else {
        // DB에 데이터가 없으면 기본 데이터 사용
        loadDefaultItems();
      }
    } catch (e) {
      console.error('Error loading items:', e);
      loadDefaultItems();
    }
  };

  const loadDefaultItems = () => {
    // 기본 데이터 (DB가 비어있거나 에러 발생 시)
    const defaultItems: Item[] = [
      {
        id: 1,
        title: "2025 제1회 퓨리얼 AI 영상 콘테스트",
        description: "'퓨리얼 정수기와 함께하는 [  ]'을 주제로 한 AI 생성 영상 공모전입니다. 독창적인 아이디어와 AI 기술을 결합하여 도전해보세요!",
        type: "contest",
        date: "2025-12-21",
        company: "퓨리얼(Pureal)",
        prize: "총상금 500만원 (대상 300만원)",
        link: "https://www.pureal.co.kr/contest",
        location: "온라인 접수",
      },
      {
        id: 2,
        title: "2025 지역주력산업 영상 콘텐츠 공모전",
        description: "중소벤처기업부 주최, 지역 주력 산업을 주제로 한 창의적인 영상 콘텐츠를 공모합니다. AI 기반 영상 제작툴 활용 가능.",
        type: "contest",
        date: "2025-12-26",
        company: "중소벤처기업부",
        prize: "장관상 및 상금 수여",
        location: "대한민국 전역",
        link: "https://www.mss.go.kr",
      },
      {
        id: 3,
        title: "AI for Good Film Festival 2026",
        description: "AI 기술을 활용하여 글로벌 사회 문제를 해결하거나 긍정적인 영향을 주는 주제의 영화/영상 출품. UN ITU 주관 글로벌 행사.",
        type: "contest",
        date: "2026-03-15",
        location: "Geneva, Switzerland (온라인 출품)",
        company: "AI for Good (ITU)",
        prize: "국제 영화제 상영 및 초청",
        link: "https://aiforgood.itu.int/summit26/",
      },
      {
        id: 4,
        title: "팀플 기반 AI 워크샵: 10일 집중 영상제작",
        description: "한국예술종합학교 전문사 영화과 주관. AI 툴을 활용한 단편 영화 제작 워크샵. 팀 프로젝트 기반 실습 진행.",
        type: "event",
        date: "2026-01-15",
        location: "한국예술종합학교 및 온라인",
        company: "한국예술종합학교",
        salary: "참가비 무료",
        link: "https://www.karts.ac.kr",
      },
      {
        id: 5,
        title: "AI Film & Ads Awards Cannes 2026",
        description: "칸에서 열리는 AI 영화 및 광고제. 생성형 AI로 제작된 혁신적인 광고 및 단편 영화를 모집합니다.",
        type: "contest",
        date: "2026-05-22",
        location: "Cannes, France",
        prize: "트로피 및 칸 현지 초청",
        link: "https://www.waiff.com",
      },
      {
        id: 6,
        title: "UI/UX 디자이너 채용 (AI/SaaS 스타트업)",
        description: "생성형 AI 서비스를 함께 만들어갈 프로덕트 디자이너를 모십니다. Figma 능숙자, AI 툴 활용 경험 우대.",
        type: "job",
        date: "2026-01-31",
        location: "서울 강남구 역삼동",
        company: "바이브코퍼레이션",
        salary: "연봉 5,000 ~ 8,000만원",
        employmentType: "정규직",
        link: "https://vibefolio.com/recruit",
      }
    ];
    setItems(defaultItems);
  };

  // 항목 추가/수정 (API 사용)
  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.date) {
      alert("제목, 설명, 날짜는 필수 항목입니다.");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("로그인이 필요합니다.");
        return;
      }

      const itemData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        date: formData.date,
        location: formData.location || null,
        prize: formData.prize || null,
        salary: formData.salary || null,
        company: formData.company || null,
        employment_type: formData.employmentType || null,
        link: formData.link || null,
        thumbnail: formData.thumbnail || null,
        is_approved: isAdmin ? true : false, // 관리자가 아니면 승인 대기
        is_active: true,
        // 추가 필드 저장
        application_target: formData.application_target || null,
        sponsor: formData.sponsor || null,
        total_prize: formData.total_prize || null,
        first_prize: formData.first_prize || null,
        start_date: formData.start_date || null,
        category_tags: formData.category_tags || null,
        banner_image_url: formData.banner_image_url || null,
      };

      if (editingItem) {
        // 수정
        const response = await fetch(`/api/recruit-items/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(itemData),
        });

        if (!response.ok) {
          throw new Error('Failed to update item');
        }
      } else {
        // 추가
        const response = await fetch('/api/recruit-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(itemData),
        });

        if (!response.ok) {
          throw new Error('Failed to create item');
        }
      }

      // 성공 후 목록 새로고침
      await loadItems();
      
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
        application_target: "",
        sponsor: "",
        total_prize: "",
        first_prize: "",
        start_date: "",
        category_tags: "",
        banner_image_url: ""
      });
      setEditingItem(null);
      handleDialogClose();
      
      if (!isAdmin) {
        alert("정보가 제보되었습니다. 관리자 승인 후 목록에 표시됩니다. 감사합니다!");
      } else {
        alert(editingItem ? "수정되었습니다." : "추가되었습니다.");
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  // AI 정보 추출 로직
  const handleExtractInfo = async () => {
    if (!formData.link) {
      toast.error("분석할 링크를 입력해주세요.");
      return;
    }

    setIsExtracting(true);
    try {
      const response = await fetch('/api/recruit/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.link }),
      });

      if (!response.ok) throw new Error('Failed to extract');

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        date: data.date || prev.date,
        company: data.company || prev.company,
        prize: data.prize || prev.prize,
        location: data.location || prev.location,
        thumbnail: data.thumbnail || prev.thumbnail,
      }));

      toast.success("AI가 정보를 성공적으로 분석했습니다!");
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error("정보 추출 중 오류가 발생했습니다.");
    } finally {
      setIsExtracting(false);
    }
  };

  // 항목 삭제 (API 사용)
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(`/api/recruit-items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // 성공 후 목록 새로고침
      await loadItems();
      alert("삭제되었습니다.");
    } catch (error) {
      console.error('Error deleting item:', error);
      alert("삭제 중 오류가 발생했습니다.");
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
      application_target: item.application_target || "",
      sponsor: item.sponsor || "",
      total_prize: item.total_prize || "",
      first_prize: item.first_prize || "",
      start_date: item.start_date || "",
      category_tags: item.category_tags || "",
      banner_image_url: item.banner_image_url || ""
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
      application_target: "",
      sponsor: "",
      total_prize: "",
      first_prize: "",
      start_date: "",
      category_tags: "",
      banner_image_url: ""
    });
  };

  // 자세히 보기 클릭 핸들러 (내부 상세 페이지로 이동)
  const handleViewDetail = (item: Item) => {
    router.push(`/recruit/${item.id}`);
  };

  // 제보하기 기능 (일반 사용자)
  const handleUserSubmit = () => {
    setEditingItem(null);
    handleDialogClose();
    setIsDialogOpen(true);
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
      <section className="w-full">
        <MainBanner />
      </section>

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
          
          {/* 관리자 추가 버튼 또는 사용자 제보 버튼 */}
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant={isAdmin ? "default" : "outline"}
                  className={isAdmin ? "bg-green-600 hover:bg-green-700 text-white" : "border-green-600 text-green-600 hover:bg-green-50"}
                  onClick={() => handleDialogClose()}
                >
                  <Plus size={18} className="mr-2" />
                  {isAdmin ? "새 항목 추가" : "정보 제보하기"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {isAdmin ? (editingItem ? "항목 수정" : "새 항목 추가") : "공모전/채용 정보 제보"}
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
                    <div className="space-y-4 border-l-4 border-[#4ACAD4] pl-4 py-2 bg-[#4ACAD4]/5 rounded-r-lg">
                      <h3 className="font-bold text-[#4ACAD4] text-sm flex items-center gap-2">
                        <Award size={16} /> 공모전 상세 정보
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">상금/혜택</label>
                          <Input value={formData.prize} onChange={e => setFormData({...formData, prize: e.target.value})} placeholder="예: 대상 500만원" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">응모 대상</label>
                          <Input value={formData.application_target} onChange={e => setFormData({...formData, application_target: e.target.value})} placeholder="예: 대학생, 일반인" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">총 상금</label>
                          <Input value={formData.total_prize} onChange={e => setFormData({...formData, total_prize: e.target.value})} placeholder="예: 2,000만원" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">1등 상금</label>
                          <Input value={formData.first_prize} onChange={e => setFormData({...formData, first_prize: e.target.value})} placeholder="예: 500만원" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">분야 (태그)</label>
                          <Input value={formData.category_tags} onChange={e => setFormData({...formData, category_tags: e.target.value})} placeholder="예: 영상, 디자인 (쉼표 구분)" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">후원/협찬</label>
                          <Input value={formData.sponsor} onChange={e => setFormData({...formData, sponsor: e.target.value})} placeholder="예: 문화체육관광부" />
                        </div>
                      </div>
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

                  {/* 이미지 섹션 (강화) */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Plus size={16} className="text-[#4ACAD4]" /> 포스터 이미지 (썸네일)
                        </label>
                        {isAdmin && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs gap-1"
                            onClick={() => document.getElementById('recruit-thumb-upload')?.click()}
                          >
                            <Upload size={12} /> 파일 업로드
                          </Button>
                        )}
                        <input 
                          type="file" 
                          id="recruit-thumb-upload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              toast.info("포스터 업로드 중...");
                              const url = await uploadImage(file, 'recruits');
                              setFormData({...formData, thumbnail: url});
                              toast.success("포스터 이미지가 적용되었습니다.");
                            } catch (err) {
                              toast.error("업로드 실패: " + (err as Error).message);
                            }
                          }}
                        />
                      </div>
                      <Input
                        placeholder="https://example.com/poster.jpg"
                        value={formData.thumbnail}
                        onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      />
                    </div>

                    {isAdmin && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" /> 상세 페이지 히어로 배너 (와이드)
                          </label>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 text-xs gap-1 bg-white"
                            onClick={() => document.getElementById('recruit-banner-upload')?.click()}
                          >
                            <Upload size={12} /> 파일 업로드
                          </Button>
                          <input 
                            type="file" 
                            id="recruit-banner-upload" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                toast.info("배너 업로드 중...");
                                const url = await uploadImage(file, 'banners');
                                setFormData({...formData, banner_image_url: url});
                                toast.success("와이드 배너 이미지가 적용되었습니다.");
                              } catch (err) {
                                toast.error("업로드 실패: " + (err as Error).message);
                              }
                            }}
                          />
                        </div>
                        <Input
                          placeholder="배너용 와이드 이미지 URL (16:6 비율 권장)"
                          value={formData.banner_image_url}
                          onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
                          className="bg-white"
                        />
                        <p className="text-[10px] text-slate-400 mt-2 italic">* 상세 페이지 상단에 와이드하게 노출될 이미지를 등록하세요.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      바로가기 링크 (필수)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com"
                        value={formData.link}
                        onChange={(e) =>
                          setFormData({ ...formData, link: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        className="shrink-0 border-[#4ACAD4] text-[#4ACAD4] hover:bg-[#4ACAD4]/10 gap-2"
                        onClick={handleExtractInfo}
                        disabled={isExtracting}
                      >
                        {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        AI 추출
                      </Button>
                    </div>
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
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isAdmin ? (editingItem ? "수정" : "추가") : "정보 제보하기"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 인기 섹션 (조회수 기준 TOP 3) */}
        {items.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-200">
                <Sparkles size={16} fill="currentColor" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">지금 가장 핫한 AI 소식</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...items]
                .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                .slice(0, 3)
                .map((item, index) => (
                  <Card 
                    key={item.id} 
                    className="relative border-none shadow-xl shadow-slate-200/50 rounded-[40px] overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-500 bg-white"
                    onClick={() => handleViewDetail(item)}
                  >
                    <div className="p-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-4xl font-black text-slate-100 group-hover:text-[#4ACAD4]/20 transition-colors uppercase leading-none">0{index + 1}</span>
                        <Badge className="bg-[#4ACAD4]/10 text-[#4ACAD4] border-none px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                           HOT TOPIC
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{item.company || "TRENDING"}</p>
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight">{item.title}</h3>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                          <Eye size={12} /> {item.views_count?.toLocaleString() || 0} 명 확인함
                        </div>
                        <ChevronRight size={16} className="text-[#4ACAD4] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        return { label: "채용", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Briefcase };
      case "contest":
        return { label: "공모전", color: "bg-purple-50 text-purple-600 border-purple-100", icon: Award };
      case "event":
        return { label: "이벤트", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Calendar };
      default:
        return { label: "기타", color: "bg-gray-50 text-gray-600 border-gray-100", icon: Calendar };
    }
  };

  const typeInfo = getTypeInfo(item.type);
  const dday = getDday(item.date);
  const isExpired = dday === '마감';

  return (
    <Card className={`group border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] overflow-hidden bg-white flex flex-col h-full ${isExpired ? 'opacity-60' : ''}`}>
      {/* Thumbnail Area - Fixed Standard Ratio (Poster Style) */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-50 flex items-center justify-center">
        {item.thumbnail ? (
          <img 
            src={item.thumbnail} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-700 pointer-events-none group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <typeInfo.icon size={48} strokeWidth={1} />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${typeInfo.color} backdrop-blur-md bg-white/80 shadow-sm`}>
            {typeInfo.label}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm ${
            isExpired 
              ? 'bg-slate-200 text-slate-500' 
              : dday === 'D-Day' 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-slate-900 text-white'
          }`}>
            {dday}
          </span>
        </div>

        {/* Action Buttons (Overlay for Admin) */}
        {isAdmin && (
          <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-600 shadow-sm" onClick={() => onEdit(item)}>
              <Edit size={14} />
            </Button>
            <Button size="icon" variant="destructive" className="w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-500 text-white shadow-sm border-none" onClick={() => onDelete(item.id)}>
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>

      <CardHeader className="p-5 pb-2">
        <div className="space-y-1.5 h-[68px]"> {/* Fixed height for title alignment */}
          {item.company && (
            <p className="text-[10px] font-black text-[#4ACAD4] tracking-wider uppercase leading-none truncate">{item.company}</p>
          )}
          <CardTitle 
            className="text-lg font-bold line-clamp-2 leading-tight group-hover:text-[#4ACAD4] transition-colors cursor-pointer"
            onClick={() => onViewDetail(item)}
          >
            {item.title}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 flex flex-col flex-1">
        <div className="h-[40px] mb-4"> {/* Fixed height for description */}
          <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed">
            {item.description}
          </p>
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-50 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-[#4ACAD4]" />
                <span>~ {new Date(item.date).toLocaleDateString("ko-KR")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye size={12} className="text-slate-300" />
                <span>{item.views_count?.toLocaleString() || 0}</span>
              </div>
            </div>
            {item.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-slate-300" />
                <span>{item.location}</span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            className="w-full h-12 rounded-2xl bg-slate-50 hover:bg-[#4ACAD4] hover:text-slate-900 transition-all duration-300 font-bold text-xs flex items-center justify-center gap-2 group/btn shadow-sm hover:shadow-[#4ACAD4]/25"
            onClick={() => onViewDetail(item)}
            disabled={isExpired}
          >
            자세히 보기
            <ExternalLink size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
          </Button>
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
