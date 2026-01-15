"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Megaphone, 
  ArrowLeft, 
  Loader2, 
  Star,
  Upload,
  Tag,
  GitCommit, 
  AlertCircle, 
  Calendar, 
  Wrench, 
  Camera,
  X,
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { uploadImage } from "@/lib/supabase/storage";
import { toast } from "sonner";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { Editor } from "@tiptap/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Types ---

interface Notice {
  id: number;
  title: string;
  content: string;
  is_important: boolean;
  is_visible: boolean;
  is_popup?: boolean;
  image_url?: string;
  link_url?: string;
  link_text?: string;
  created_at: string;
  version?: string;
  category: string; 
  tags?: string[];
}

const CATEGORY_CONFIG = {
  notice: { label: "일반 공지", color: "bg-blue-100 text-blue-600", icon: Megaphone },
  update: { label: "업데이트", color: "bg-purple-100 text-purple-600", icon: GitCommit },
  event: { label: "이벤트", color: "bg-pink-100 text-pink-600", icon: Calendar },
  maintenance: { label: "점검", color: "bg-amber-100 text-amber-600", icon: Wrench },
};

// --- Main Page Component ---

export default function AdminNoticesPage() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const router = useRouter();
  
  // View State
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // List State
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setNotices(data as any);
    } catch (err) {
      console.error("Notice load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) {
      loadNotices();
    }
  }, [isAdmin, adminLoading, router]);

  const handleCreateNew = () => {
    setSelectedNotice(null);
    setViewMode('editor');
  };

  const handleEdit = (notice: Notice) => {
    setSelectedNotice(notice);
    setViewMode('editor');
  };

  const handleBackToList = () => {
    setViewMode('list');
    loadNotices();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const { error } = await (supabase.from("notices") as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("삭제되었습니다.");
      loadNotices();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.version && n.version.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (adminLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!isAdmin) return null;

  // --- EDITOR VIEW (Full Page) ---
  if (viewMode === 'editor') {
    return (
      <NoticeEditor 
        initialData={selectedNotice} 
        onBack={handleBackToList} 
        onSave={() => {
            handleBackToList();
            toast.success(selectedNotice ? "공지사항이 수정되었습니다." : "새 공지사항이 등록되었습니다.");
        }}
      />
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <Link href="/admin" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-4 transition-colors">
              <ArrowLeft size={18} className="mr-2" />
              배시보드로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Megaphone className="text-blue-500" />
              공지사항 관리
            </h1>
            <p className="text-slate-500 mt-2">서비스 업데이트, 점검, 이벤트 등 새로운 소식을 등록하세요.</p>
          </div>
          <Button onClick={handleCreateNew} className="h-12 px-6 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
            <Plus size={18} className="mr-2" />
            새 공지 / 버전 등록
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="제목, 버전 등으로 검색..." 
              className="pl-11 h-12 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 px-6" onClick={loadNotices}>
            새로고침
          </Button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4">
          {loading && notices.length === 0 ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-300" size={32} /></div>
          ) : filteredNotices.length > 0 ? (
            filteredNotices.map(notice => {
              const categoryInfo = CATEGORY_CONFIG[notice.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.notice;
              const Icon = categoryInfo.icon;
              
              return (
                <Card key={notice.id} className={`overflow-hidden transition-all hover:shadow-md border-slate-100 ${!notice.is_visible ? "opacity-60 bg-slate-50" : "bg-white"}`}>
                  <CardHeader className="flex flex-row items-center justify-between py-6">
                    <div className="flex items-center gap-5">
                      {/* Icon Box */}
                      <div className={`w-12 h-12 rounded-2xl ${categoryInfo.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <Icon size={22} />
                      </div>
                      
                      <div>
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                           <Badge variant="outline" className={`${categoryInfo.color} border-none`}>{categoryInfo.label}</Badge>
                           {notice.version && (
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 font-mono">
                                <GitCommit size={10} className="mr-1" />
                                {notice.version}
                              </Badge>
                           )}
                           {!notice.is_visible && <Badge variant="secondary">비공개</Badge>}
                           {notice.is_important && <Badge variant="destructive" className="animate-pulse">중요</Badge>}
                           {notice.is_popup && <Badge className="bg-indigo-500 hover:bg-indigo-600">팝업 ON</Badge>}
                        </div>

                        <CardTitle className="text-xl font-bold text-slate-900 mb-1">{notice.title}</CardTitle>
                        
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                          {notice.tags && notice.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <Tag size={12} />
                                <span>{notice.tags.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-600" onClick={() => handleEdit(notice)}>
                        <Edit size={18} />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-red-50 text-red-500" onClick={() => handleDelete(notice.id)}>
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] py-32 text-center">
              <Megaphone size={48} className="mx-auto text-slate-200 mb-6" />
              <p className="text-slate-400 text-lg">등록된 공지사항이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: NOTICE EDITOR (Mimics Project Upload) ---

function NoticeEditor({ initialData, onBack, onSave }: { initialData: Notice | null, onBack: () => void, onSave: () => void }) {
  // State
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.image_url || null);
  
  // Settings
  const [category, setCategory] = useState(initialData?.category || "notice");
  const [version, setVersion] = useState(initialData?.version || "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");
  const [isImportant, setIsImportant] = useState(initialData?.is_important || false);
  const [isVisible, setIsVisible] = useState(initialData?.is_visible !== false); // Default true
  const [isPopup, setIsPopup] = useState(initialData?.is_popup || false);
  const [linkUrl, setLinkUrl] = useState(initialData?.link_url || "");
  const [linkText, setLinkText] = useState(initialData?.link_text || "자세히 보기");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  // Handlers
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('이미지 크기는 10MB를 초과할 수 없습니다.');
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) { toast.error("제목을 입력해주세요."); return; }
    
    // Get HTML content from editor reference if available, else state
    const currentContent = editorRef.current ? editorRef.current.getHTML() : content;
    if (!currentContent || currentContent === '<p></p>') { toast.error("내용을 입력해주세요."); return; }

    setIsSubmitting(true);
    try {
      // 1. Upload Cover Image (if changed or new)
      let finalImageUrl = coverPreview;
      if (coverImage) {
         finalImageUrl = await uploadImage(coverImage, 'notices');
      }

      const noticeData = {
        title,
        content: currentContent,
        category,
        version: version || null,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        is_important: isImportant,
        is_visible: isVisible,
        is_popup: isPopup,
        image_url: finalImageUrl,
        link_url: linkUrl,
        link_text: linkText,
      };

      if (initialData) {
        const { error } = await (supabase.from("notices") as any).update(noticeData).eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("notices") as any).insert([noticeData]);
        if (error) throw error;
      }

      onSave();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <button
               onClick={onBack}
               className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
               <ArrowLeft size={16} />
               <span className="font-medium">리스트로 돌아가기</span>
            </button>
            <div className="flex items-center gap-3">
               <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                 {isSubmitting ? "저장 중..." : "자동 저장은 지원되지 않습니다"}
               </span>
               <Button onClick={handleSave} disabled={isSubmitting} className="bg-slate-900 text-white rounded-xl px-6 font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2"/> 발행하기</>}
               </Button>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
         
         {/* 1. Meta & Cover Section */}
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Title Input */}
            <div className="space-y-4">
               <input 
                  type="text" 
                  placeholder="제목을 입력하세요" 
                  className="w-full text-4xl sm:text-5xl font-black bg-transparent border-none focus:outline-none placeholder:text-slate-200 text-slate-900"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
               />
               <div className="flex flex-wrap items-center gap-4">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border-slate-200 shadow-sm font-bold text-slate-600">
                      <SelectValue placeholder="카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notice">📢 일반 공지</SelectItem>
                      <SelectItem value="update">🚀 업데이트</SelectItem>
                      <SelectItem value="event">🎉 이벤트</SelectItem>
                      <SelectItem value="maintenance">🔧 점검/장애</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative flex-1 max-w-[200px]">
                      <GitCommit className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <Input 
                        placeholder="버전 (ex: v1.0.0)" 
                        className="pl-9 h-10 rounded-xl bg-white border-slate-200 shadow-sm font-mono text-sm"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                      />
                  </div>
                  
                  <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <Input 
                        placeholder="태그 입력 (콤마로 구분)" 
                        className="pl-9 h-10 rounded-xl bg-white border-slate-200 shadow-sm text-sm"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                  </div>
               </div>
            </div>

            {/* Cover Image */}
            <div className="group relative w-full aspect-[21/9] bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors">
               {coverPreview ? (
                  <>
                     <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <Button variant="secondary" size="sm" onClick={() => { setCoverImage(null); setCoverPreview(null); }}>
                           <Trash2 size={14} className="mr-2" /> 제거
                        </Button>
                        <Button variant="default" size="sm" onClick={() => document.getElementById('full-cover-upload')?.click()}>
                           <Camera size={14} className="mr-2" /> 변경
                        </Button>
                     </div>
                  </>
               ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                     <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        <Camera size={24} />
                     </div>
                     <span className="font-bold text-slate-400 group-hover:text-blue-500">커버 이미지 추가</span>
                     <input type="file" className="hidden" id="full-cover-upload" accept="image/*" onChange={handleCoverImageChange} />
                  </label>
               )}
            </div>
         </div>

         {/* 2. Editor Section */}
         <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[600px] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 relative z-0">
            <TiptapEditor 
               content={content} 
               onChange={setContent}
               placeholder="공지사항 내용을 자유롭게 작성하세요..."
               onEditorReady={(editor) => { editorRef.current = editor; }}
            />
         </div>

         {/* 3. Settings Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            {/* Visibility Settings */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Eye size={18} /> 공개 설정
               </h3>
               <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                     <span className="text-sm font-medium text-slate-600">사용자에게 공개</span>
                     <div className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${isVisible ? 'bg-green-500' : 'bg-slate-300'}`}>
                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${isVisible ? 'translate-x-5' : 'translate-x-0'}`} />
                        <input type="checkbox" className="hidden" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
                     </div>
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                     <span className="text-sm font-medium text-slate-600 flex items-center gap-2"><Star size={14} className="fill-orange-400 text-orange-400"/> 중요 공지로 고정</span>
                     <div className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${isImportant ? 'bg-orange-500' : 'bg-slate-300'}`}>
                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${isImportant ? 'translate-x-5' : 'translate-x-0'}`} />
                        <input type="checkbox" className="hidden" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} />
                     </div>
                  </label>
               </div>
            </div>

            {/* Popup Settings */}
            <div className={`p-6 rounded-3xl border shadow-sm space-y-4 transition-all ${isPopup ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'}`}>
               <div className="flex items-center justify-between">
                  <h3 className={`font-bold flex items-center gap-2 ${isPopup ? 'text-indigo-900' : 'text-slate-900'}`}>
                     <AlertCircle size={18} /> 메인 팝업 설정
                  </h3>
                  <div className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${isPopup ? 'bg-indigo-500' : 'bg-slate-300'}`} onClick={() => setIsPopup(!isPopup)}>
                     <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${isPopup ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
               </div>
               
               {isPopup && (
                  <div className="space-y-3 pt-2 animate-in fade-in">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-700">링크 URL (선택)</label>
                        <Input 
                           placeholder="https://..." 
                           className="bg-white border-indigo-200 h-9 text-sm"
                           value={linkUrl}
                           onChange={(e) => setLinkUrl(e.target.value)}
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-700">버튼 텍스트</label>
                        <Input 
                           placeholder="자세히 보기" 
                           className="bg-white border-indigo-200 h-9 text-sm"
                           value={linkText}
                           onChange={(e) => setLinkText(e.target.value)}
                        />
                     </div>
                     <p className="text-xs text-indigo-500 pt-1">* 팝업 이미지는 상단의 커버 이미지가 사용됩니다.</p>
                  </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
}
