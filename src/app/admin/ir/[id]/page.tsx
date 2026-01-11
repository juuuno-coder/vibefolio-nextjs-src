import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Save, 
  ArrowLeft, 
  LayoutTemplate, 
  Trash2, 
  Plus, 
  Image as ImageIcon,
  Copy,
  FileJson,
  Wand2 // Magic wand icon for template
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { uploadImage } from "@/lib/supabase/storage";
import { toBlob } from 'html-to-image'; // Import image capture lib

interface IrSlide {
  id: string;
  deck_id: string;
  order_index: number;
  layout_type: 'cover' | 'basic' | 'image_left' | 'image_right' | 'grid' | 'big_number' | 'swot';
  title: string;
  content: string;
  bullet_points: any;
  image_url: string | null;
  speaker_notes: string | null;
}

interface IrDeck {
  id: string;
  team_name: string;
  title: string;
}

export default function IrSlideEditorPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deck, setDeck] = useState<IrDeck | null>(null);
  const [slides, setSlides] = useState<IrSlide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null); // Ref for the preview area

  useEffect(() => {
    const fetchDeckAndSlides = async () => {
      try {
        // 1. Fetch Deck
        const { data: deckData, error: deckError } = await supabase
          .from('ir_decks')
          .select('*')
          .eq('id', params.id)
          .single();

        if (deckError) throw deckError;
        setDeck(deckData);

        // 2. Fetch Slides
        const { data: slidesData, error: slidesError } = await supabase
          .from('ir_slides')
          .select('*')
          .eq('deck_id', params.id)
          .order('order_index', { ascending: true });

        if (slidesError) throw slidesError;
        setSlides(slidesData || []);
        
        if (slidesData && slidesData.length > 0) {
          setActiveSlideId(slidesData[0].id);
        }

      } catch (error) {
        console.error('Error fetching IR data:', error);
        toast.error('데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeckAndSlides();
  }, [params.id, supabase]);

  const activeSlide = slides.find(s => s.id === activeSlideId);

  const handleUpdateSlide = (field: keyof IrSlide, value: any) => {
    if (!activeSlide) return;
    const updatedSlides = slides.map(s => 
      s.id === activeSlideId ? { ...s, [field]: value } : s
    );
    setSlides(updatedSlides);
  };

  const handleSave = async () => {
    if (!activeSlide) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ir_slides')
        .update({
          layout_type: activeSlide.layout_type,
          title: activeSlide.title,
          content: activeSlide.content,
          image_url: activeSlide.image_url,
          speaker_notes: activeSlide.speaker_notes
        })
        .eq('id', activeSlide.id);

      if (error) throw error;
      toast.success('저장되었습니다.');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlide = async () => {
    if (!deck) return;
    try {
      const newOrderIndex = slides.length;
      const { data, error } = await supabase
        .from('ir_slides')
        .insert({
          deck_id: deck.id,
          order_index: newOrderIndex,
          layout_type: 'basic',
          title: '새 슬라이드',
          content: '내용을 입력하세요.'
        })
        .select()
        .single();

      if (error) throw error;
      setSlides([...slides, data]);
      setActiveSlideId(data.id);
      toast.success('슬라이드가 추가되었습니다.');
    } catch (error) {
      toast.error('슬라이드 추가 실패');
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('ir_slides').delete().eq('id', id);
      if (error) throw error;
      
      const newSlides = slides.filter(s => s.id !== id);
      setSlides(newSlides);
      if (activeSlideId === id && newSlides.length > 0) {
        setActiveSlideId(newSlides[0].id);
      }
      toast.success('삭제되었습니다.');
    } catch (error) {
      toast.error('삭제 실패');
    }
  };

  // Analyze Template Feature
  const handleApplyTemplate = async () => {
    if (!confirm('기존 슬라이드가 모두 삭제되고 추천 템플릿으로 대체됩니다. 계속하시겠습니까?')) return;
    if (!deck) return;

    setLoading(true);
    try {
      // 1. Delete all existing slides
      await supabase.from('ir_slides').delete().eq('deck_id', deck.id);

      // 2. Define Template Slides (Standard IR Deck Structure)
      const templateSlides = [
        { title: 'COVER', layout: 'cover', content: `# ${deck.team_name}\n\n## **Service Title**\nOne-line Slogan or Value Proposition` },
        { title: 'PROBLEM', layout: 'basic', content: '### **The Pain Point**\n\nExplain the problem clearly.\n\n- Who has this problem?\n- How severe is it?\n- Current inefficient solutions?' },
        { title: 'SOLUTION', layout: 'image_right', content: '### **Our Solution**\n\nDescribe how your product solves the problem.\n\n- Key Features\n- Why is it better?\n- Core Technology' },
        { title: 'MARKET', layout: 'grid', content: '### **Market Opportunity**\n\n- **TAM**: Total Addressable Market\n- **SAM**: Serviceable Available Market\n- **SOM**: Serviceable Obtainable Market' },
        { title: 'PRODUCT', layout: 'image_left', content: '### **Product Demo**\n\nShowcase your product UI/UX.\n\n- Core Functionality 1\n- Core Functionality 2' },
        { title: 'BUSINESS MODEL', layout: 'basic', content: '### **Revenue Model**\n\nHow do we make money?\n\n- Subscription\n- Commission\n- B2B Licensing' },
        { title: 'COMPETITOR', layout: 'swot', content: '### **Competitive Analysis**\n\nWhy are we winning?\n\n- Our unfair advantage\n- Positioning Map' },
        { title: 'ROADMAP', layout: 'basic', content: '### **Growth Plan**\n\n- Q1: MVP Launch\n- Q2: User Acquisition\n- Q3: Monetization' },
        { title: 'TEAM', layout: 'grid', content: '### **The Dream Team**\n\n- **CEO**: Vision & Strategy\n- **CTO**: Tech & Developement\n- **CMO**: Marketing & Growth' },
        { title: 'Q&A', layout: 'cover', content: '# **Thank You**\n\nContact: email@example.com\n\nAny Questions?' },
      ];

      // 3. Insert Template Slides
      for (let i = 0; i < templateSlides.length; i++) {
        await supabase.from('ir_slides').insert({
          deck_id: deck.id,
          order_index: i,
          layout_type: templateSlides[i].layout,
          title: templateSlides[i].title,
          content: templateSlides[i].content,
          speaker_notes: 'Add your script here...'
        });
      }

      // 4. Refresh
      const { data: newSlides } = await supabase
        .from('ir_slides')
        .select('*')
        .eq('deck_id', deck.id)
        .order('order_index', { ascending: true });
        
      if (newSlides) {
        setSlides(newSlides);
        setActiveSlideId(newSlides[0].id);
      }
      toast.success('추천 템플릿이 적용되었습니다!');

    } catch (error) {
      console.error('Template error:', error);
      toast.error('템플릿 적용 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      const publicUrl = await uploadImage(file, 'ir-assets');
      if (publicUrl) {
        handleUpdateSlide('image_url', publicUrl);
        toast.success('이미지가 업로드되었습니다.');
      } else {
        toast.error('이미지 업로드 실패');
      }
    } catch (error) {
      toast.error('이미지 업로드 중 오류 발생');
    } finally {
      setUploading(false);
    }
  };

  // --- NEW: Copy to Figma Functions ---

  const handleCopyToFigmaImage = async () => {
    if (previewRef.current === null) {
      return;
    }

    try {
      // 1. Capture the DOM element as a blob (PNG)
      // Using toBlob usually produces a Blob from canvas
      const blob = await toBlob(previewRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      
      if (!blob) {
         throw new Error("Failed to generate image blob");
      }

      // 2. Write to clipboard
      // Note: navigator.clipboard.write expects an array of ClipboardItem
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);

      toast.success('이미지로 복사되었습니다! Figma에 Ctrl+V 하세요.');
    } catch (err) {
      console.error('Copy to image failed', err);
      toast.error('이미지 복사 실패: 브라우저 호환성을 확인하세요.');
    }
  };

  const handleCopyToFigmaJSON = async () => {
    if (!activeSlide) return;

    // Construct a simple JSON schema that represents the slide content
    const figmaData = {
      type: "VIBEFOLIO_SLIDE",
      version: "1.0",
      data: {
        title: activeSlide.title,
        content: activeSlide.content,
        layout: activeSlide.layout_type,
        imageUrl: activeSlide.image_url,
        notes: activeSlide.speaker_notes,
      }
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(figmaData, null, 2));
      toast.success('데이터(JSON)로 복사되었습니다! Figma 플러그인 등에서 활용하세요.');
    } catch (err) {
      toast.error('데이터 복사 실패');
    }
  };

  // --- End Copy Functions ---


  if (loading) return <div className="p-8">Loading editor...</div>;

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Top Bar */}
      <div className="h-16 border-b bg-white px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/ir')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{deck?.team_name}</h1>
            <p className="text-xs text-muted-foreground">{deck?.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleApplyTemplate} className="gap-2 text-violet-600 border-violet-200 bg-violet-50 hover:bg-violet-100">
            <Wand2 className="w-4 h-4" />
            추천 템플릿 적용
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Slide List */}
        <div className="w-64 bg-white border-r flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-neutral-50/50">
            <span className="font-semibold text-sm text-neutral-500">슬라이드 목록</span>
            <Button variant="ghost" size="icon" onClick={handleAddSlide}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => setActiveSlideId(slide.id)}
                className={`p-3 rounded-lg cursor-pointer border transition-all hover:border-blue-400 group relative ${
                  activeSlideId === slide.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-neutral-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500">
                    {index + 1}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteSlide(slide.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs font-medium truncate">{slide.layout_type.toUpperCase()}</div>
                <div className="text-sm truncate text-neutral-700">{slide.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Editor Form */}
        <div className="flex-1 overflow-y-auto p-8 max-w-2xl border-r bg-white">
          {activeSlide ? (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  슬라이드 편집: {activeSlide.title} <span className="text-xs font-normal text-muted-foreground bg-neutral-100 px-2 py-1 rounded-full">ID: {activeSlide.order_index}</span>
                </h2>
              </div>
              
              <div className="space-y-2">
                <Label>레이아웃 유형</Label>
                <Select 
                  value={activeSlide.layout_type} 
                  onValueChange={(val) => handleUpdateSlide('layout_type', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="레이아웃 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">표지 (Cover)</SelectItem>
                    <SelectItem value="basic">기본 (Title + Content)</SelectItem>
                    <SelectItem value="image_left">이미지 좌측 (Image Left)</SelectItem>
                    <SelectItem value="image_right">이미지 우측 (Image Right)</SelectItem>
                    <SelectItem value="grid">그리드 (Grid)</SelectItem>
                    <SelectItem value="big_number">강조 (Big Number)</SelectItem>
                    <SelectItem value="swot">4분할 (SWOT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>슬라이드 제목</Label>
                <Input 
                  value={activeSlide.title} 
                  onChange={(e) => handleUpdateSlide('title', e.target.value)}
                  className="text-lg font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label>내용 (Markdown 지원)</Label>
                <Textarea 
                  value={activeSlide.content} 
                  onChange={(e) => handleUpdateSlide('content', e.target.value)}
                  className="min-h-[200px] font-mono text-sm leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">**굵게**, - 리스트 등을 사용할 수 있습니다.</p>
              </div>

               <div className="space-y-2">
                <Label>발표자 노트 (스크립트)</Label>
                <Textarea 
                  value={activeSlide.speaker_notes || ''} 
                  onChange={(e) => handleUpdateSlide('speaker_notes', e.target.value)}
                  className="min-h-[100px] bg-yellow-50/50 border-yellow-200"
                  placeholder="발표 시 참고할 스크립트를 작성하세요."
                />
              </div>

              <div className="space-y-2">
                <Label>참조 이미지</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                     <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </div>
                  {activeSlide.image_url && (
                    <div className="w-20 h-20 rounded border overflow-hidden shrink-0 relative group">
                      <img src={activeSlide.image_url} alt="Reference" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => handleUpdateSlide('image_url', null)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                 <p className="text-xs text-muted-foreground">참고용 이미지나 다이어그램을 업로드하세요.</p>
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              슬라이드를 선택하세요.
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 bg-neutral-100 p-8 flex flex-col overflow-hidden">
           <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-bold text-neutral-500 flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" />
              PREVIEW
            </h3>
            <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={handleCopyToFigmaImage} className="gap-2 bg-white hover:bg-neutral-50" title="이미지로 복사해서 Figma에 붙여넣기">
                <Copy className="w-3.5 h-3.5" />
                이미지로 복사
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyToFigmaJSON} className="gap-2 bg-white hover:bg-neutral-50" title="JSON 데이터로 복사">
                <FileJson className="w-3.5 h-3.5" />
                데이터로 복사
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center overflow-auto">
            {activeSlide ? (
              <div 
                ref={previewRef}
                className="w-[960px] h-[540px] bg-white rounded-xl shadow-2xl shrink-0 p-12 relative flex flex-col overflow-hidden transition-all duration-300 transform scale-[0.7] origin-top-left"
                style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}
              >
                {/* Header / Logo Area */}
                <div className="absolute top-8 right-12 text-xs font-bold text-neutral-300 uppercase tracking-widest">
                  {deck?.team_name || 'Vibefolio'}
                </div>

                {/* Dynamic Layout Rendering */}
                {activeSlide.layout_type === 'cover' && (
                   <div className="flex flex-col justify-center h-full">
                     <h1 className="text-6xl font-black text-neutral-900 mb-6 leading-tight whitespace-pre-wrap">
                       {activeSlide.title}
                     </h1>
                     <div className="text-2xl text-neutral-500 whitespace-pre-wrap font-light leading-relaxed">
                       {activeSlide.content}
                     </div>
                   </div>
                )}

                {activeSlide.layout_type === 'basic' && (
                  <div className="h-full flex flex-col">
                    <h2 className="text-4xl font-bold text-neutral-900 mb-8 border-l-4 border-blue-600 pl-4">
                      {activeSlide.title}
                    </h2>
                    <div className="flex-1 prose prose-lg max-w-none text-neutral-600">
                      <ReactMarkdown>{activeSlide.content}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {activeSlide.layout_type === 'image_right' && (
                  <div className="h-full flex gap-12">
                     <div className="flex-1 flex flex-col justify-center">
                        <h2 className="text-4xl font-bold text-neutral-900 mb-8 leading-tight">
                          {activeSlide.title}
                        </h2>
                        <div className="prose text-neutral-600">
                          <ReactMarkdown>{activeSlide.content}</ReactMarkdown>
                        </div>
                     </div>
                     <div className="flex-1 bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                        {activeSlide.image_url ? (
                          <img src={activeSlide.image_url} alt="slide visual" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-neutral-300 flex flex-col items-center">
                            <ImageIcon className="w-12 h-12 mb-2" />
                            <span className="text-sm font-medium">Image Placeholder</span>
                          </div>
                        )}
                     </div>
                  </div>
                )}

                {activeSlide.layout_type === 'image_left' && (
                  <div className="h-full flex gap-12 flex-row-reverse">
                     <div className="flex-1 flex flex-col justify-center">
                        <h2 className="text-4xl font-bold text-neutral-900 mb-8">
                          {activeSlide.title}
                        </h2>
                        <div className="prose text-neutral-600">
                          <ReactMarkdown>{activeSlide.content}</ReactMarkdown>
                        </div>
                     </div>
                     <div className="flex-1 bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {activeSlide.image_url ? (
                          <img src={activeSlide.image_url} alt="slide visual" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-neutral-300 flex flex-col items-center">
                            <ImageIcon className="w-12 h-12 mb-2" />
                            <span className="text-sm font-medium">Image Placeholder</span>
                          </div>
                        )}
                     </div>
                  </div>
                )}
                
                 {activeSlide.layout_type === 'grid' && (
                  <div className="h-full flex flex-col">
                    <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
                      {activeSlide.title}
                    </h2>
                    <div className="flex-1 grid grid-cols-2 gap-6">
                      <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100">
                         <div className="prose prose-sm"><ReactMarkdown>{activeSlide.content.split('\n\n')[0] || ''}</ReactMarkdown></div>
                      </div>
                      <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100">
                         <div className="prose prose-sm"><ReactMarkdown>{activeSlide.content.split('\n\n')[1] || ''}</ReactMarkdown></div>
                      </div>
                      <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100">
                         <div className="prose prose-sm"><ReactMarkdown>{activeSlide.content.split('\n\n')[2] || ''}</ReactMarkdown></div>
                      </div>
                       <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100 flex items-center justify-center text-neutral-300">
                         <ImageIcon className="w-8 h-8" />
                      </div>
                    </div>
                  </div>
                )}

                {activeSlide.layout_type === 'swot' && (
                  <div className="h-full flex flex-col">
                    <h2 className="text-3xl font-bold text-neutral-900 mb-6 text-center">
                      {activeSlide.title}
                    </h2>
                     <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
                        <div className="bg-blue-50 p-6 rounded-xl flex flex-col">
                          <span className="text-blue-500 font-bold mb-2">STRENGTH</span>
                          <div className="text-sm text-neutral-700 flex-1"><ReactMarkdown>{activeSlide.content}</ReactMarkdown></div>
                        </div>
                        <div className="bg-red-50 p-6 rounded-xl flex flex-col">
                           <span className="text-red-500 font-bold mb-2">WEAKNESS</span>
                           <div className="text-sm text-neutral-700">- ...</div>
                        </div>
                        <div className="bg-green-50 p-6 rounded-xl flex flex-col">
                           <span className="text-green-500 font-bold mb-2">OPPORTUNITY</span>
                           <div className="text-sm text-neutral-700">- ...</div>
                        </div>
                        <div className="bg-orange-50 p-6 rounded-xl flex flex-col">
                           <span className="text-orange-500 font-bold mb-2">THREAT</span>
                           <div className="text-sm text-neutral-700">- ...</div>
                        </div>
                     </div>
                  </div>
                )}
                
                 {activeSlide.layout_type === 'big_number' && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-neutral-400 mb-8 uppercase tracking-widest">
                      {activeSlide.title}
                    </h2>
                    <div className="text-8xl font-black text-blue-600 mb-6 tracking-tight">
                       {activeSlide.content.split('\n')[0] || '0%'}
                    </div>
                     <div className="text-xl text-neutral-600 max-w-xl leading-relaxed">
                       <ReactMarkdown>{activeSlide.content.split('\n').slice(1).join('\n') || ''}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Speaker Notes Overlay (Visible only when hovering bottom) */}
                {activeSlide.speaker_notes && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm text-white p-6 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="text-xs font-bold text-yellow-400 mb-2 uppercase">Speaker Notes</div>
                    <p className="text-sm leading-relaxed">{activeSlide.speaker_notes}</p>
                  </div>
                )}
              </div>
            ) : (
               <div className="text-neutral-400">Loading Preview...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
