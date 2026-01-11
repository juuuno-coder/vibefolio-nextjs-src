"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Save, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  LayoutTemplate, 
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  Layout
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadImage } from "@/lib/supabase/storage";

interface IRSlide {
  id: number;
  deck_id: number;
  order_index: number;
  layout_type: 'cover' | 'basic' | 'image_left' | 'image_right' | 'grid' | 'big_number' | 'swot';
  title: string;
  content: string;
  image_url: string | null;
  speaker_notes: string;
}

interface IRDeck {
  id: number;
  team_name: string;
  title: string;
  description: string;
}

const LAYOUT_OPTIONS = [
  { value: 'cover', label: '표지 (Cover)' },
  { value: 'basic', label: '기본 (제목+내용)' },
  { value: 'image_left', label: '이미지 좌측' },
  { value: 'image_right', label: '이미지 우측' },
  { value: 'grid', label: '그리드 (4분할)' },
  { value: 'big_number', label: '강조 숫표' },
];

export default function IREditPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const deckId = params?.id;

  const [deck, setDeck] = useState<IRDeck | null>(null);
  const [slides, setSlides] = useState<IRSlide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 현재 선택된 슬라이드 객체
  const activeSlide = slides.find(s => s.id === activeSlideId);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin && deckId) {
      fetchDeckData();
    }
  }, [deckId, isAdmin, adminLoading]);

  const fetchDeckData = async () => {
    try {
      setLoading(true);
      
      // 덱 정보
      const { data: deckData, error: deckError } = await (supabase as any)
        .from('ir_decks')
        .select('*')
        .eq('id', deckId)
        .single();
      
      if (deckError) throw deckError;
      setDeck(deckData);

      // 슬라이드 정보
      const { data: slideData, error: slideError } = await (supabase as any)
        .from('ir_slides')
        .select('*')
        .eq('deck_id', deckId)
        .order('order_index', { ascending: true });

      if (slideError) throw slideError;
      
      setSlides(slideData || []);
      if (slideData && slideData.length > 0) {
        setActiveSlideId(slideData[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 적용 (선배 기수 자료 분석 기반)
  const applyTemplate = async () => {
    if (!confirm("기존 슬라이드가 모두 삭제되고 추천 템플릿으로 초기화됩니다. 진행하시겠습니까?")) return;

    try {
      setLoading(true);
      // 기존 삭제
      await (supabase as any).from('ir_slides').delete().eq('deck_id', deckId);

      // 추천 템플릿 데이터
      // 분석 내용: Cover -> Problem -> Solution -> Market -> Product -> BM -> Competitor -> Roadmap -> Team -> Outro
      const templateSlides = [
        {
          order_index: 0,
          layout_type: 'cover',
          title: `${deck?.team_name || 'Team'} IR Presentation`,
          content: '한 줄 핵심 캐치프레이즈를 입력하세요.\n(예: AI 기술로 만드는 나만의 포트폴리오)',
          speaker_notes: '인사말 준비: 안녕하십니까, OOO 팀의 발표자 OOO입니다.'
        },
        {
          order_index: 1,
          layout_type: 'basic',
          title: 'Problem (문제 제기)',
          content: '### 우리가 발견한 문제점\n\n1. 기존 시장의 페인 포인트(Pain Point) 1\n2. 사용자들의 불만 사항\n3. 이를 뒷받침하는 통계나 기사 인용',
          speaker_notes: '청중의 공감을 이끌어내는 스토리텔링 필요.'
        },
        {
          order_index: 2,
          layout_type: 'image_right',
          title: 'Solution (해결책)',
          content: '### 우리의 솔루션\n\n우리는 이 문제를 **OOO 기술**을 통해 해결합니다.\n\n- 핵심 기능 1\n- 핵심 기능 2\n- 차별화 포인트',
          speaker_notes: '문제와 1:1로 매칭되는 명쾌한 해결책 제시.'
        },
        {
          order_index: 3,
          layout_type: 'grid',
          title: 'Market Opportunity (시장 분석)',
          content: '### 시장 규모 (TAM-SAM-SOM)\n\n- **TAM**: 전체 유효 시장\n- **SAM**: 서비스 가용 시장\n- **SOM**: 수익 수익 시장',
          speaker_notes: '시장이 충분히 크다는 것을 수치로 증명.'
        },
        {
          order_index: 4,
          layout_type: 'image_left',
          title: 'Product / Service (서비스 소개)',
          content: '### 주요 화면 및 기능\n\n사용자는 앱에서 OOO를 할 수 있습니다.\n(여기에 앱 구동 GIF나 스크린샷 배치)',
          speaker_notes: '실제 데모 영상이나 핵심 UI 흐름을 설명.'
        },
        {
          order_index: 5,
          layout_type: 'basic',
          title: 'Business Model (수익 모델)',
          content: '### 어떻게 돈을 버는가?\n\n1. **구독 모델 (Subscription)**: 월 9,900원\n2. **광고 수익**: 배너 및 네이티브 광고\n3. **수수료**: 거래 건당 N%',
          speaker_notes: '실현 가능하고 구체적인 수익화 전략.'
        },
        {
          order_index: 6,
          layout_type: 'swot', 
          title: 'Competitor Analysis (경쟁사 분석)',
          content: '### 경쟁 우위\n\n- 경쟁사 A 대비: 가격 경쟁력\n- 경쟁사 B 대비: 기술적 우위\n- 포지셔닝 맵 설명',
          speaker_notes: '우리가 왜 이길 수밖에 없는지 설득.'
        },
        {
          order_index: 7,
          layout_type: 'basic',
          title: 'Growth Strategy / Roadmap',
          content: '### 성장 전략\n\n- **2026 Q1**: MVP 출시 및 베타 테스트\n- **2026 Q2**: 사용자 1만 명 달성\n- **2026 Q3**: 시리즈 A 투자 유치',
          speaker_notes: '비전과 실행 계획을 타임라인으로 제시.'
        },
        {
          order_index: 8,
          layout_type: 'grid',
          title: 'Team (팀 소개)',
          content: '### 최고의 팀원들\n\n- **CEO**: 경력 사항\n- **CTO**: 기술 역량\n- **Designer**: 포트폴리오',
          speaker_notes: '이 문제를 해결하기에 최적화된 팀임을 강조.'
        },
        {
          order_index: 9,
          layout_type: 'cover',
          title: 'Q & A',
          content: '경청해 주셔서 감사합니다.\n\nContact: email@example.com',
          speaker_notes: '마무리 인사 및 질의응답 대응.'
        }
      ];

      const { error } = await (supabase as any).from('ir_slides').insert(
        templateSlides.map(s => ({ ...s, deck_id: deckId }))
      );

      if (error) throw error;

      toast.success("템플릿이 적용되었습니다.");
      fetchDeckData();
    } catch (err) {
      console.error(err);
      toast.error("템플릿 적용 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlide = async (field: keyof IRSlide, value: string) => {
    if (!activeSlide) return;
    
    // 로컬 상태 즉시 업데이트 (UI 반응성)
    setSlides(prev => prev.map(s => s.id === activeSlide.id ? { ...s, [field]: value } : s));

    // 디바운스 없이 저장은 별도 Save 버튼이나 탭 이탈 시? 
    // 일단 여기선 개별 필드 변경 시 자동 저장을 구현하지 않고, '저장하기' 버튼을 두거나 
    // or useDebounce pattern. For MVP, let's use explicit Save button for heavy edits, 
    // but update local state here.
  };

  const handleSaveAll = async () => {
    if (!activeSlide) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('ir_slides')
        .update({
          title: activeSlide.title,
          content: activeSlide.content,
          layout_type: activeSlide.layout_type,
          image_url: activeSlide.image_url,
          speaker_notes: activeSlide.speaker_notes
        })
        .eq('id', activeSlide.id);

      if (error) throw error;
      toast.success("저장되었습니다.");
    } catch (err) {
      toast.error("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSlide = async () => {
    try {
      const newOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order_index)) + 1 : 0;
      const { data, error } = await (supabase as any)
        .from('ir_slides')
        .insert([{
          deck_id: deckId,
          order_index: newOrder,
          title: '새 슬라이드',
          content: '', 
          layout_type: 'basic'
        }])
        .select()
        .single();
      
      if (error) throw error;
      setSlides([...slides, data]);
      setActiveSlideId(data.id);
    } catch (err) {
      toast.error("추가 실패");
    }
  };

  const handleDeleteSlide = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await (supabase as any).from('ir_slides').delete().eq('id', id);
      const remaining = slides.filter(s => s.id !== id);
      setSlides(remaining);
      if (activeSlideId === id && remaining.length > 0) {
        setActiveSlideId(remaining[0].id);
      } else if (remaining.length === 0) {
        setActiveSlideId(null);
      }
      toast.success("삭제됨");
    } catch (err) {
      toast.error("삭제 실패");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSlide) return;

    try {
      toast.info("이미지 업로드 중...");
      const url = await uploadImage(file, 'projects'); // 기존 버킷 재사용
      await handleUpdateSlide('image_url', url);
      // 즉시 저장
      await (supabase as any).from('ir_slides').update({ image_url: url }).eq('id', activeSlide.id);
      toast.success("이미지 업로드 완료");
    } catch (err) {
      toast.error("업로드 실패");
    }
  };

  if (loading) return <div className="p-20 text-center"><span className="loading loading-spinner"></span> 로딩 중...</div>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. 사이드바 (슬라이드 목록) */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/ir')}>
                <ChevronLeft size={20} />
            </Button>
            <span className="font-bold text-slate-700 truncate">{deck?.team_name}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {slides.length === 0 && (
                <div className="text-center py-10 px-2 space-y-4">
                    <p className="text-xs text-slate-400">슬라이드가 없습니다.</p>
                    <Button onClick={applyTemplate} variant="outline" className="w-full text-xs border-orange-200 text-orange-600 hover:bg-orange-50">
                        <LayoutTemplate size={14} className="mr-2" /> 
                        추천 템플릿 적용
                    </Button>
                </div>
            )}
            
            {slides.map((slide, idx) => (
                <div 
                    key={slide.id}
                    onClick={() => setActiveSlideId(slide.id)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all ${
                        activeSlideId === slide.id 
                        ? 'bg-orange-50 border-orange-200 shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-orange-100 hover:bg-slate-50'
                    }`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ${
                            activeSlideId === slide.id ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                            {slide.layout_type}
                        </span>
                    </div>
                    <p className={`text-xs font-medium truncate ${activeSlideId === slide.id ? 'text-slate-900' : 'text-slate-500'}`}>
                        {slide.title || '(제목 없음)'}
                    </p>
                </div>
            ))}
        </div>

        <div className="p-3 border-t border-slate-100">
            <Button onClick={handleCreateSlide} className="w-full bg-slate-900 text-white hover:bg-slate-800">
                <Plus size={16} className="mr-2" /> 슬라이드 추가
            </Button>
        </div>
      </div>

      {/* 2. 메인 에디터 영역 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 헤더 */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <h2 className="font-bold text-lg text-slate-800 truncate max-w-md">
                   {activeSlide ? `슬라이드 편집: ${activeSlide.title}` : '슬라이드를 선택하세요'}
                </h2>
                {activeSlide && (
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-xs text-slate-500 font-mono">
                        ID: {activeSlide.id}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                {activeSlide && (
                    <>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteSlide(activeSlide.id)}>
                            <Trash2 size={16} />
                        </Button>
                        <Button 
                            onClick={handleSaveAll} 
                            disabled={saving}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
                        >
                            {saving ? <span className="loading loading-spinner w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />}
                            저장하기
                        </Button>
                    </>
                )}
            </div>
        </div>

        {/* 편집 폼 & 미리보기 */}
        {activeSlide ? (
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    
                    {/* 왼쪽: 입력 폼 */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">레이아웃 유형</label>
                            <Select 
                                value={activeSlide.layout_type} 
                                onValueChange={(val) => handleUpdateSlide('layout_type', val)}
                            >
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="레이아웃 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LAYOUT_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">슬라이드 제목</label>
                            <Input 
                                value={activeSlide.title} 
                                onChange={(e) => handleUpdateSlide('title', e.target.value)}
                                className="bg-white font-bold text-lg"
                                placeholder="제목을 입력하세요"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">내용 (Markdown 지원)</label>
                            <Textarea 
                                value={activeSlide.content || ''} 
                                onChange={(e) => handleUpdateSlide('content', e.target.value)}
                                className="bg-white min-h-[200px] font-mono text-sm leading-relaxed"
                                placeholder="내용을 입력하세요..."
                            />
                            <p className="text-[10px] text-slate-400">**굵게**, - 리스트 등을 사용할 수 있습니다.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">발표자 노트 (스크립트)</label>
                            <Textarea 
                                value={activeSlide.speaker_notes || ''} 
                                onChange={(e) => handleUpdateSlide('speaker_notes', e.target.value)}
                                className="bg-amber-50/50 border-amber-200 min-h-[100px] text-sm"
                                placeholder="발표 시 참고할 멘트를 적으세요..."
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                             <label className="text-sm font-bold text-slate-600 mb-2 block">참조 이미지</label>
                             <div className="flex items-center gap-4">
                                {activeSlide.image_url && (
                                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-white">
                                        <img src={activeSlide.image_url} alt="Slide" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        id="slide-image-upload" 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                    <Button 
                                        variant="outline" 
                                        className="w-full border-dashed"
                                        onClick={() => document.getElementById('slide-image-upload')?.click()}
                                    >
                                        <ImageIcon size={16} className="mr-2 text-slate-400" />
                                        {activeSlide.image_url ? '이미지 변경' : '이미지 업로드'}
                                    </Button>
                                    <p className="text-[10px] text-slate-400 mt-1">참고용 이미지나 다이어그램을 업로드하세요.</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* 오른쪽: 미리보기 (Figma 스타일 와이어프레임) */}
                    <div className="bg-slate-200 rounded-3xl p-8 flex flex-col sticky top-6 h-fit min-h-[400px]">
                        <div className="mb-4 flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-widest">
                            <span>Preview</span>
                            <span>{deck?.team_name}</span>
                        </div>
                        
                        {/* 슬라이드 캔버스 */}
                        <div className="aspect-video bg-white rounded-xl shadow-2xl p-8 flex flex-col relative overflow-hidden">
                            {/* 배경 데코 */}
                            {(activeSlide.layout_type === 'cover' || activeSlide.layout_type === 'big_number') && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-bl-full pointer-events-none opacity-50" />
                            )}

                            {/* 제목 영역 */}
                            <div className="mb-6 z-10">
                                <h1 className={`font-black text-slate-900 ${activeSlide.layout_type === 'cover' ? 'text-4xl mt-10' : 'text-2xl'}`}>
                                    {activeSlide.title || '제목 없음'}
                                </h1>
                                {activeSlide.layout_type === 'cover' && (
                                    <div className="w-20 h-2 bg-orange-500 mt-4" />
                                )}
                            </div>

                            {/* 본문 영역 */}
                            <div className="flex-1 z-10 whitespace-pre-wrap">
                                {activeSlide.image_url && (
                                    <img 
                                        src={activeSlide.image_url} 
                                        className={`rounded-lg object-contain bg-slate-50 mb-4 border border-slate-100 ${
                                            activeSlide.layout_type === 'image_right' ? 'w-1/2 float-right ml-4' : 
                                            activeSlide.layout_type === 'image_left' ? 'w-1/2 float-left mr-4' : 
                                            activeSlide.layout_type === 'cover' ? 'w-full h-40 object-cover mt-4' :
                                            'w-full max-h-40'
                                        }`} 
                                    />
                                )}
                                <div className={`text-slate-600 leading-relaxed ${activeSlide.layout_type === 'cover' ? 'text-lg font-medium mt-4' : 'text-sm'}`}>
                                    {activeSlide.content}
                                </div>
                            </div>
                            
                            {/* 푸터 */}
                            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase">
                                <span>VIBEFOLIO IR DECK</span>
                                <span>{activeSlide.order_index + 1} / {slides.length}</span>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-slate-800 rounded-xl text-slate-300 text-xs font-mono">
                            <span className="text-orange-400 font-bold block mb-1">Speaker Notes:</span>
                            {activeSlide.speaker_notes || '작성된 스크립트가 없습니다.'}
                        </div>
                    </div>

                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                <LayoutTemplate size={64} className="mb-4 opacity-50" />
                <p>왼쪽에서 슬라이드를 선택하거나 추가하세요</p>
            </div>
        )}
      </div>
    </div>
  );
}
