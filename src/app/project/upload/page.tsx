"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EmbedModal, AssetModal, Asset, StyleModal, CTAButtonModal, SettingsModal } from "@/components/editor/EditorBlocks";
import { PhotoGridModal, GridLayout } from "@/components/editor/PhotoGridModal";
import { LightroomModal } from "@/components/editor/LightroomModal";
import '@/components/editor/tiptap.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faWandMagicSparkles,
  faPalette,
  faPenRuler,
  faVideo,
  faFilm,
  faHeadphones,
  faCube,
  faFileLines,
  faCode,
  faMobileScreen,
  faGamepad,
  faUpload,
  faCheck,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";
import { GENRE_TO_CATEGORY_ID, GENRE_CATEGORIES, FIELD_CATEGORIES } from '@/lib/constants';
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Editor } from "@tiptap/react"; // Import Editor type

// 아이콘 매핑
const genreIcons: Record<string, IconDefinition> = {
  photo: faCamera,
  animation: faWandMagicSparkles,
  graphic: faPalette,
  design: faPenRuler,
  video: faVideo,
  cinema: faFilm,
  audio: faHeadphones,
  "3d": faCube,
  text: faFileLines,
  code: faCode,
  webapp: faMobileScreen,
  game: faGamepad,
};

// 장르 카테고리 (데이터 + 아이콘)
const genreCategories = GENRE_CATEGORIES.map(g => ({
  ...g,
  icon: genreIcons[g.id] || faCube
}));

const fieldCategories = FIELD_CATEGORIES;

import { useSearchParams } from "next/navigation";

export default function TiptapUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  // Step 1: Content (Editor), Step 2: Info (Settings)
  const [step, setStep] = useState<'content' | 'info'>('content');
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Editor Instance State
  const [editor, setEditor] = useState<Editor | null>(null);
  const sidebarFileInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [embedModalType, setEmbedModalType] = useState<"media" | "prototype" | "3d">("media");
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [ctaModalOpen, setCtaModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [photoGridModalOpen, setPhotoGridModalOpen] = useState(false);
  const [lightroomModalOpen, setLightroomModalOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projectBgColor, setProjectBgColor] = useState("#FFFFFF");
  const [contentSpacing, setContentSpacing] = useState(60);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("프로젝트를 등록하려면 먼저 로그인해주세요.");
        router.push("/login");
        return;
      }
      setUserId(user.id);

      // 수정 모드일 경우 데이터 로드
      if (editId) {
        try {
          const res = await fetch(`/api/projects/${editId}`);
          if (!res.ok) throw new Error("프로젝트를 불러올 수 없습니다.");
          const { project } = await res.json();
          
          if (project) {
            // 본인 프로젝트인지 확인 (API에서 안 막으면 여기서라도)
            if (project.user_id !== user.id) {
               toast.error("수정 권한이 없습니다.");
               router.push("/");
               return;
            }

            setTitle(project.title || "");
            setSummary(project.description || ""); // DB 컬럼 확인 필요하지만 일단 description 매핑
            setContent(project.content_text || "");
            setCoverPreview(project.thumbnail_url || project.image_url);
            
            if (project.custom_data) {
              try {
                const custom = typeof project.custom_data === 'string' ? JSON.parse(project.custom_data) : project.custom_data;
                if (custom.genres) setSelectedGenres(custom.genres);
                if (custom.fields) setSelectedFields(custom.fields);
              } catch (e) {
                console.error("Custom data parse error", e);
              }
            }
          }
        } catch (error) {
          console.error("Load project error:", error);
          toast.error("프로젝트 정보를 불러오는데 실패했습니다.");
        }
        return; // 수정 모드면 임시저장 불러오기 패스
      }

      // 로컬스토리지에서 임시 저장된 데이터 복구 (신규 작성 시에만)
      const savedDraft = localStorage.getItem('project_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (confirm('임시 저장된 작업이 있습니다. 불러오시겠습니까?')) {
            setTitle(draft.title || '');
            setSummary(draft.summary || '');
            setContent(draft.content || '');
            setSelectedGenres(draft.genres || []);
            setSelectedFields(draft.fields || []);
          }
        } catch (e) {
          console.error('Draft load error:', e);
        }
      }

      // 사용자 관심사 로드
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('interests')
          .eq('id', user.id)
          .single();

        if (userData) {
          const interests = (userData as any).interests;
          if (interests && !savedDraft) {
            if (interests.genres) setSelectedGenres(interests.genres);
            if (interests.fields) setSelectedFields(interests.fields);
          }
        }
      } catch (error) {
        console.error("관심사 로드 실패:", error);
      }
    };
    
    init();
  }, [router, editId]);

  // 에디터 내용 동기화 (수정 모드 로딩 후)
  useEffect(() => {
    if (editor && content && !editor.getText()) { // 에디터가 비어있고 컨텐츠가 로드되었을 때만
       editor.commands.setContent(content);
    }
  }, [editor, content]);

  // 자동 저장 (30초마다) - 수정 모드 아닐 때만? or 수정 모드여도 draft 별도 저장?
  // 헷갈릴 수 있으니 수정 모드일 때는 자동저장 끄거나 별도 키 사용. 일단 둠.
  useEffect(() => {
    if (content && !editId) { // 수정 모드 아닐 때만 로컬 draft 저장
      const interval = setInterval(() => {
        const draft = {
          title,
          summary,
          content, 
          genres: selectedGenres,
          fields: selectedFields,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('project_draft', JSON.stringify(draft));
        setLastSaved(new Date());
        // 조용한 자동저장 알림 (번거로우지 않게)
        console.log('[Draft] 자동 저장됨:', new Date().toLocaleTimeString());
      }, 30000); // 30초

      return () => clearInterval(interval);
    }
  }, [title, content, selectedGenres, selectedFields, editId]);
  
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

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleField = (id: string) => {
    setSelectedFields(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Step 1 -> Step 2
  const handleContinue = () => {
    const currentContent = editor ? editor.getHTML() : content;
    if (!currentContent || currentContent === '<p></p>') {
      toast.error('프로젝트 내용을 작성해주세요.');
      return;
    }
    // Update local content state to match editor
    setContent(currentContent);
    setStep('info');
    window.scrollTo(0, 0); // Scroll to top for settings page
  };

  // Step 2 -> Submit
  const handleSubmit = async (settings?: any) => {
    if (isSubmitting && !settings) return;

    // settings가 있으면 해당 값을 우선 사용, 없으면 현재 상태값 사용
    const finalTitle = settings?.title || title;
    const finalSummary = settings?.summary || summary;
    const finalGenres = settings?.selectedGenres || selectedGenres;
    const finalFields = settings?.selectedFields || selectedFields;
    const finalTags = settings?.tagList || [];

    if (!finalTitle.trim()) {
      toast.error('프로젝트 제목을 입력해주세요.');
      return;
    }
    
    if (finalGenres.length === 0) {
      toast.error('최소 1개의 장르를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!userId) throw new Error('로그인이 필요합니다.');

      // 1. 커버 이미지 URL 결정
      let coverUrl = settings?.coverUrl || (editId ? coverPreview : null);

      // 2. 새 커버 이미지가 있으면 업로드
      if (coverImage) {
        coverUrl = await uploadImage(coverImage);
      }

      // 3. 커버 이미지가 없고 본문이 있다면, 본문 첫 번째 이미지 또는 영상 썸네일 추출 (자동 썸네일)
      if (!coverUrl && content) {
        try {
          const doc = new DOMParser().parseFromString(content, 'text/html');
          
          // 1순위: 이미지 태그
          const firstImg = doc.querySelector('img');
          if (firstImg) {
            coverUrl = firstImg.getAttribute('src');
          }
          
          // 2순위: 유튜브 임베드 (이미지가 없을 경우)
          if (!coverUrl) {
            const firstIframe = doc.querySelector('iframe');
            if (firstIframe) {
               const src = firstIframe.getAttribute('src');
               if (src) {
                 // YouTube URL Parsing
                 const youtubeMatch = src.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([^?&]+)/);
                 if (youtubeMatch && youtubeMatch[1]) {
                   coverUrl = `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
                 }
               }
            }
          }
        } catch (e) {
          console.error('Thumbnail extraction failed:', e);
        }
      }

      // 4. 최종적으로도 썸네일이 없으면 에러
      if (!coverUrl) {
         toast.error('커버 이미지를 선택하거나 본문에 이미지를 포함해주세요.');
         setIsSubmitting(false);
         return;
      }

      // 프로젝트 생성/수정
      // 카테고리 우선순위 로직 적용 (영상/3D 등이 그래픽보다 우선시됨)
      let category_id = 1;
      
      const hasVideo = finalGenres.some((g: string) => ['video', 'animation', 'cinema', 'game', 'audio'].includes(g));
      const has3D = finalGenres.includes('3d');
      const hasWeb = finalGenres.some((g: string) => ['code', 'webapp', 'it'].includes(g));
      
      if (hasVideo) {
        category_id = 3; // Video/Multimedia
      } else if (has3D) {
        category_id = 7; // 3D
      } else if (hasWeb) {
        category_id = 5; // Web/App
      } else {
        category_id = GENRE_TO_CATEGORY_ID[finalGenres[0]] || 1;
      }
      
      const url = editId ? `/api/projects/${editId}` : '/api/projects';
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          category_id,
          title: finalTitle,
          summary: finalSummary, // API에서 처리하는지 확인 필요, 없으면 무시됨
          description: finalSummary, // description으로도 보냄 (API 호환성)
          content_text: content, // Tiptap HTML content
          thumbnail_url: coverUrl, // URL Update
          rendering_type: 'rich_text',
          custom_data: JSON.stringify({
            genres: finalGenres,
            fields: finalFields,
            tags: finalTags, 
          }),
          assets: assets,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '서버 에러');

      // 임시 저장 데이터 삭제
      if (!editId) {
         localStorage.removeItem('project_draft');
      }

      toast.success(editId ? '프로젝트가 수정되었습니다!' : '프로젝트가 성공적으로 발행되었습니다!');
      router.push('/');
    } catch (error: any) {
      console.error('Submit Error:', error);
      toast.error(error.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Sidebar Handlers ---
  const handleAddText = () => {
    editor?.chain().focus().insertContent('<p>새로운 텍스트를 입력하세요...</p>').run();
  };

  const handleSidebarImageClick = () => {
    sidebarFileInputRef.current?.click();
  };

  const handleSidebarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error('이미지 업로드에 실패했습니다.');
      } finally {
        if (sidebarFileInputRef.current) sidebarFileInputRef.current.value = '';
      }
    }
  };

  // 포토 그리드 핸들러 - 모달 열기
  const handleAddGrid = () => {
    setPhotoGridModalOpen(true);
  };

  // 포토 그리드 제출 핸들러
  const handlePhotoGridSubmit = (images: string[], layout: GridLayout) => {
    if (!editor || images.length === 0) return;

    // 레이아웃에 따른 그리드 HTML 생성
    let gridHtml = '';
    const count = images.length;

    // 그리드 클래스 결정
    let gridClass = 'photo-grid';
    switch (layout) {
      case '2-col':
        gridClass += ' grid-2';
        break;
      case '3-col':
        gridClass += ' grid-3';
        break;
      case '1-2':
        gridClass += ' grid-1-2';
        break;
      case '2-1':
        gridClass += ' grid-2-1';
        break;
      default: // auto
        if (count === 2) gridClass += ' grid-2';
        else if (count === 3) gridClass += ' grid-3';
        else if (count >= 4) gridClass += ' grid-2';
    }

    // 1+2 레이아웃
    if (layout === '1-2' && count >= 3) {
      gridHtml = `
        <div class="${gridClass}">
          <div class="grid-item-large"><img src="${images[0]}" alt="" /></div>
          <div class="grid-item-row">
            <img src="${images[1]}" alt="" />
            <img src="${images[2]}" alt="" />
          </div>
          ${images.slice(3).map(img => `<img src="${img}" alt="" />`).join('')}
        </div>
      `;
    }
    // 2+1 레이아웃
    else if (layout === '2-1' && count >= 3) {
      gridHtml = `
        <div class="${gridClass}">
          <div class="grid-item-row">
            <img src="${images[0]}" alt="" />
            <img src="${images[1]}" alt="" />
          </div>
          <div class="grid-item-large"><img src="${images[2]}" alt="" /></div>
          ${images.slice(3).map(img => `<img src="${img}" alt="" />`).join('')}
        </div>
      `;
    }
    // 기본 그리드 (2열, 3열, 자동)
    else {
      gridHtml = `
        <div class="${gridClass}">
          ${images.map(img => `<img src="${img}" alt="" />`).join('')}
        </div>
      `;
    }

    editor.chain().focus().insertContent(gridHtml).run();
  };

  const handleAddVideo = () => {
    const url = window.prompt('YouTube 또는 Vimeo URL을 입력하세요:');
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const handleAddCode = () => {
     editor?.chain().focus().toggleCodeBlock().run();
  };

  // --- Modal Handlers ---
  const handleOpenEmbedModal = (type: "media" | "prototype" | "3d") => {
    setEmbedModalType(type);
    setEmbedModalOpen(true);
  };

  const handleEmbedSubmit = (code: string) => {
    if (!editor) return;
    // Extract src from iframe or use as URL
    const srcMatch = code.match(/src=["']([^"']+)["']/);
    const url = srcMatch ? srcMatch[1] : code;

    if (url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo')) {
      editor.commands.setYoutubeVideo({ src: url });
    } else {
      // Insert as raw HTML for other embeds
      editor.commands.insertContent(`<div class="embed-container" data-src="${url}"><iframe src="${url}" width="100%" height="400" frameborder="0" allowfullscreen></iframe></div>`);
    }
  };

  const handleStyleSave = (bgColor: string, spacing: number) => {
    setProjectBgColor(bgColor);
    setContentSpacing(spacing);
  };

  const handleAssetFileSelect = async (files: FileList) => {
    // TODO: Implement asset upload and management
    console.log('Selected assets:', files);
    toast.success(`${files.length}개의 에셋이 선택되었습니다. (기능 준비 중)`);
  };

  const handleCtaSave = (type: "follow" | "none") => {
    console.log('CTA type:', type);
  };

  const handleSettingsSave = (settings: any) => {
    // SettingsModal에서 전달받은 세련된 데이터들을 부모 상태에 업데이트
    if (settings.title) setTitle(settings.title);
    if (settings.selectedGenres) setSelectedGenres(settings.selectedGenres);
    if (settings.selectedFields) setSelectedFields(settings.selectedFields);
    
    // 태그 리스트를 문자열로 변환하여 저장하거나, 나중에 API 전송 시 사용
    // 일단 상태를 업데이트한 후 실제 제출 함수 실행
    setIsSubmitting(true);
    setTimeout(() => {
      handleSubmit(settings);
    }, 100);
  };

  // Lightroom에서 이미지 가져오기
  const handleLightroomImport = (images: string[]) => {
    if (!editor || images.length === 0) return;
    
    // 이미지들을 에디터에 삽입
    images.forEach(url => {
      editor.chain().focus().setImage({ src: url }).run();
    });
  };

  if (step === 'info') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 py-12 px-4 transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={() => setStep('content')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">에디터로 돌아가기</span>
            </button>
            <div className="text-right">
               <h1 className="text-3xl font-black text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                발행 설정
               </h1>
               <p className="text-sm text-gray-500 mt-1">프로젝트의 마지막 디테일을 채워주세요</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-12 space-y-10">
            {/* 커버 이미지 */}
            <div className="space-y-4">
              <label className="text-xl font-bold text-gray-900 flex items-center gap-2">
                커버 이미지
                <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">필수</span>
              </label>
              
              <div className="flex gap-8 items-start">
                 {/* Preview Area */}
                 <div className="flex-1">
                   {coverPreview ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-gray-100 shadow-md group">
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                         <button
                           onClick={() => {
                             setCoverImage(null);
                             setCoverPreview(null);
                           }}
                           className="px-4 py-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-colors text-sm font-medium"
                         >
                           제거
                         </button>
                         <label htmlFor="change-cover" className="px-4 py-2 bg-white text-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors text-sm font-medium">
                           변경
                         </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50/10 transition-all group bg-gray-50/50">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all">
                          <FontAwesomeIcon icon={faCamera} className="w-6 h-6 text-gray-400 group-hover:text-green-500" />
                        </div>
                        <p className="text-lg font-semibold text-gray-600 group-hover:text-green-600 transition-colors">클릭하여 이미지 업로드</p>
                        <p className="text-sm text-gray-400 mt-1">1280x720 권장 (최대 10MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                      />
                    </label>
                  )}
                  {/* Hidden input for 'Change' button */}
                  <input
                    id="change-cover"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                  />
                 </div>
                 
                 {/* Side Info */}
                 <div className="w-1/3 text-sm text-gray-500 space-y-4 pt-2">
                    <p>
                       매력적인 커버 이미지는 조회수를 높이는 가장 좋은 방법입니다. 
                       프로젝트의 핵심을 잘 보여주는 고화질 이미지를 선택하세요.
                    </p>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                       <h4 className="font-semibold text-gray-700 mb-2">팁</h4>
                       <ul className="space-y-1 list-disc list-inside text-gray-500 text-xs">
                          <li>텍스트가 너무 많지 않은 이미지</li>
                          <li>16:9 비율이 가장 좋습니다</li>
                          <li>애니메이션(GIF)도 지원합니다</li>
                       </ul>
                    </div>
                 </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100"></div>

            {/* 제목 */}
            <div className="space-y-3">
              <label className="text-xl font-bold text-gray-900">
                프로젝트 제목
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                type="text"
                placeholder="멋진 프로젝트의 이름을 지어주세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl h-16 px-6 font-bold border-2 border-gray-200 focus:border-green-500 rounded-xl transition-all placeholder:font-normal placeholder:text-gray-300"
              />
            </div>

            {/* 한줄 소개 */}
            <div className="space-y-3">
              <label className="text-xl font-bold text-gray-900">
                한줄 소개
                <span className="text-sm font-normal text-gray-400 ml-2">(선택)</span>
              </label>
              <Input
                type="text"
                placeholder="작품을 한 문장으로 소개해 주세요. (상세 페이지 댓글 상단에 표시됩니다)"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="text-lg h-14 px-6 font-medium border-2 border-gray-200 focus:border-green-500 rounded-xl transition-all placeholder:text-gray-300"
              />
            </div>

            {/* 장르 */}
            <div className="space-y-4">
              <label className="text-xl font-bold text-gray-900">
                작품 장르
                <span className="text-sm font-normal text-gray-400 ml-2">최대 3개까지 선택 가능</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {genreCategories.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all font-medium relative overflow-hidden ${
                        isSelected
                          ? "bg-green-50 border-green-500 text-green-700 shadow-sm"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <FontAwesomeIcon icon={genre.icon} className={isSelected ? "text-green-600" : "text-gray-400"} />
                      <span>{genre.label}</span>
                      {isSelected && (
                         <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-bl-lg"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 산업 분야 */}
            <div className="space-y-4">
              <label className="text-xl font-bold text-gray-900">
                관련 분야
                <span className="text-sm font-normal text-gray-400 ml-2">(선택)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {fieldCategories.map((field) => {
                  const isSelected = selectedFields.includes(field.id);
                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => toggleField(field.id)}
                      className={`px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
                        isSelected
                          ? "bg-gray-800 border-gray-800 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {field.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 my-8"></div>

            {/* 발행 버튼 */}
            <div className="flex justify-end gap-4">
               <button
                  onClick={() => setStep('content')}
                  className="px-8 py-4 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
               >
                 취소
               </button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-16 px-12 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    발행 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUpload} className="w-5 h-5" />
                    프로젝트 발행하기
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Content Step
  return (
    <div className="w-full min-h-screen bg-gray-50/50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title || "새 프로젝트"}</h2>
              <p className="text-xs text-gray-500 truncate max-w-[300px]">{summary}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                 {lastSaved ? (
                    <>
                       <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-green-500" />
                       <span className="text-green-600">저장됨</span>
                       <span className="text-gray-300">|</span>
                       <span>{lastSaved.toLocaleTimeString('ko-KR')}</span>
                    </>
                 ) : "작성 중..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button
              variant="ghost"
              className="text-gray-500 hover:text-gray-900"
              onClick={() => {
                const draft = { title, summary, content: editor?.getHTML() || content, genres: selectedGenres, fields: selectedFields, savedAt: new Date().toISOString() };
                localStorage.setItem('project_draft', JSON.stringify(draft));
                setLastSaved(new Date());
                toast.success('임시 저장되었습니다.');
              }}
             >
               임시 저장
             </Button>
            <Button
              onClick={handleContinue}
              className="bg-green-600 hover:bg-green-700 text-white px-8 h-10 rounded-full font-bold shadow-md transition-all hover:scale-105"
            >
              계속하기 →
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout: Editor + Sidebar */}
      <div className="max-w-[1600px] mx-auto flex pt-8 pb-20 px-6 gap-10">
        
        {/* Editor Area (Left/Center) */}
        <div className="flex-1 flex justify-center">
          <div 
            className="w-full max-w-[900px] min-h-[1000px] shadow-sm rounded-lg overflow-hidden border border-gray-100 bg-white" 
            style={{ backgroundColor: projectBgColor }}
          >
            <TiptapEditor
              content={content}
              onChange={setContent}
              onEditorReady={setEditor}
              placeholder="여기에 내용을 입력하세요..."
            />
          </div>
        </div>

        {/* Right Sidebar (Sticky) */}
        <div className="hidden xl:block w-[320px] flex-shrink-0">
           <div className="sticky top-28">
             <EditorSidebar 
               onAddText={handleAddText}
               onAddImage={handleSidebarImageClick}
               onAddVideo={handleAddVideo}
               onAddGrid={handleAddGrid}
               onAddCode={handleAddCode}
               onAddEmbed={() => handleOpenEmbedModal("media")}
               onAddLightroom={() => setLightroomModalOpen(true)}
               onAddPrototype={() => handleOpenEmbedModal("prototype")}
               onAdd3D={() => handleOpenEmbedModal("3d")}
               onStyleClick={() => setStyleModalOpen(true)}
               onSettingsClick={() => setSettingsModalOpen(true)}
               onAddAsset={() => setAssetModalOpen(true)}
             />
           </div>
           
           {/* Hidden File Input for Sidebar (Single Image) */}
           <input 
             type="file"
             ref={sidebarFileInputRef}
             className="hidden"
             accept="image/*"
             onChange={handleSidebarFileChange}
           />
        </div>
      </div>

      {/* Modals */}
      <EmbedModal
        isOpen={embedModalOpen}
        onClose={() => setEmbedModalOpen(false)}
        onSubmit={handleEmbedSubmit}
        type={embedModalType}
      />
      <AssetModal
        isOpen={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        assets={assets}
        onAssetsChange={setAssets}
      />
      <StyleModal
        isOpen={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
        onSave={handleStyleSave}
        initialBgColor={projectBgColor}
        initialSpacing={contentSpacing}
      />
      <CTAButtonModal
        isOpen={ctaModalOpen}
        onClose={() => setCtaModalOpen(false)}
        onSave={handleCtaSave}
      />
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onSave={handleSettingsSave}
      />
      <PhotoGridModal
        isOpen={photoGridModalOpen}
        onClose={() => setPhotoGridModalOpen(false)}
        onSubmit={handlePhotoGridSubmit}
      />
      <LightroomModal
        isOpen={lightroomModalOpen}
        onClose={() => setLightroomModalOpen(false)}
        onImport={handleLightroomImport}
      />
    </div>
  );
}
