"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TiptapEditor from "@/components/editor/TiptapEditor"; // Already dynamic internally
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import '@/components/editor/tiptap.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { GridLayout } from "@/components/editor/PhotoGridModal";
import type { Asset } from "@/components/editor/EditorBlocks";

// Dynamic Imports for Code Splitting (Bundle Size Optimization)
const EmbedModal = dynamic(() => import("@/components/editor/EditorBlocks").then(mod => mod.EmbedModal), { ssr: false });
const AssetModal = dynamic(() => import("@/components/editor/EditorBlocks").then(mod => mod.AssetModal), { ssr: false });
const StyleModal = dynamic(() => import("@/components/editor/EditorBlocks").then(mod => mod.StyleModal), { ssr: false });
const CTAButtonModal = dynamic(() => import("@/components/editor/EditorBlocks").then(mod => mod.CTAButtonModal), { ssr: false });
const SettingsModal = dynamic(() => import("@/components/editor/EditorBlocks").then(mod => mod.SettingsModal), { ssr: false });
const PhotoGridModal = dynamic(() => import("@/components/editor/PhotoGridModal").then(mod => mod.PhotoGridModal), { ssr: false });
const LightroomModal = dynamic(() => import("@/components/editor/LightroomModal").then(mod => mod.LightroomModal), { ssr: false });
const LeanCanvasModal = dynamic(() => import("@/components/LeanCanvasModal").then(mod => mod.LeanCanvasModal), { ssr: false });
const CollaboratorManager = dynamic(() => import("@/components/CollaboratorManager").then(mod => mod.CollaboratorManager), { ssr: false });

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
  faComment,
  faStar,
  faRocket,
  faClock,
  faUser, // Add faUser
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
  const mode = searchParams.get('mode');
  const projectIdParam = searchParams.get('projectId');
  const isVersionMode = mode === 'version' && !!projectIdParam;

  // Step 1: Content (Editor), Step 2: Info (Settings)
  const [step, setStep] = useState<'content' | 'info'>('content');
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [allowMichelinRating, setAllowMichelinRating] = useState(true);
  const [allowStickers, setAllowStickers] = useState(true);
  const [allowSecretComments, setAllowSecretComments] = useState(true);
  const [isFeedbackRequested, setIsFeedbackRequested] = useState(false); // [Growth Mode]
  const [isAiGeneratingTitle, setIsAiGeneratingTitle] = useState(false);
  const [isAiGeneratingSummary, setIsAiGeneratingSummary] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [originalProjectTitle, setOriginalProjectTitle] = useState(""); // For version mode context
  const [previousContent, setPreviousContent] = useState(""); // Previous version content for reference
  const [versions, setVersions] = useState<any[]>([]); // All versions of this project

  // Editor Instance State
  const [editor, setEditor] = useState<Editor | null>(null);
  const sidebarFileInputRef = useRef<HTMLInputElement>(null);

  // Scheduled Publishing State
  const [scheduledAt, setScheduledAt] = useState<string>(''); // YYYY-MM-DDTHH:mm:ss
  
  // Visibility State
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');

  // Modal States
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [embedModalType, setEmbedModalType] = useState<"media" | "prototype" | "3d">("media");
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [ctaModalOpen, setCtaModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [photoGridModalOpen, setPhotoGridModalOpen] = useState(false);
  const [lightroomModalOpen, setLightroomModalOpen] = useState(false);
  const [leanCanvasOpen, setLeanCanvasOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projectBgColor, setProjectBgColor] = useState("#FFFFFF");
  const [contentSpacing, setContentSpacing] = useState(60);
  const [showOriginal, setShowOriginal] = useState(false); // [New] Toggle for Reference Viewer
  const [collaboratorEmails, setCollaboratorEmails] = useState<string[]>([]); // [New] For new projects

  const handleLightroomImport = (images: string[]) => {
    if (!editor || images.length === 0) return;
    images.forEach(url => {
      editor.chain().focus().setImage({ src: url }).run();
    });
  };

  const handleLeanCanvasApply = (markdownContent: string) => {
    if (!editor) return;
    
    // Simple Markdown to HTML conversion
    let html = markdownContent
       .replace(/### (.*?)\n/g, '<h3>$1</h3>')
       .replace(/## (.*?)\n/g, '<h2>$1</h2>')
       .replace(/\n\n/g, '<br/><br/>')
       .replace(/\n/g, '<br/>');

    editor.chain().focus().insertContent(html).run();
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        toast.error("프로젝트를 등록하려면 먼저 로그인해주세요.");
        router.push("/login");
        return;
      }
      setUserId(user.id);

      // 수정 모드 또는 버전 모드일 경우 데이터 로드 (권한 체크 및 컨텍스트용)
      if (editId || isVersionMode) {
        const targetId = Number(editId || projectIdParam);
        
        try {
          const { data: projectData, error: fetchError } = await supabase
              .from('Project')
              .select(`
                *,
                Category (
                  category_id,
                  name
                )
              `)
              .eq('project_id', targetId)
              .single();

          if (fetchError || !projectData) {
             console.error("Fetch error:", fetchError);
             throw new Error('프로젝트를 불러오는데 실패했습니다.');
          }
          
          // Cast to any to bypass strict type checks for missing generated columns (like image_url, scheduled_at)
          const project = projectData as any;

          if (project.user_id !== user.id) {
               toast.error("권한이 없습니다.");
               router.push("/");
               return;
          }

            if (isVersionMode) {
                // 버전 모드: 원본 제목만 저장하고 에디터는 비움
                setOriginalProjectTitle(project.title);
                setPreviousContent(project.content_text || "");
                setTitle(""); 
                setSummary("");
                setContent(""); // Start fresh
                // 커버 이미지도 비움 (새 버전용)
                setCoverPreview(null);
            } else {
                // 수정 모드: 기존 내용 로드
                setTitle(project.title || "");
                setSummary(project.description || "");
                setContent(project.content_text || "");
                
                // Load visibility setting
                if (project.visibility) {
                    setVisibility(project.visibility as 'public' | 'private' | 'unlisted');
                } else {
                    setVisibility('public');
                }

                setCoverPreview(project.thumbnail_url || project.image_url);
                
                if (project.custom_data) {
                  try {
                    const custom = typeof project.custom_data === 'string' ? JSON.parse(project.custom_data) : project.custom_data;
                    if (custom.genres) setSelectedGenres(custom.genres);
                    if (custom.fields) setSelectedFields(custom.fields);
                    if (custom.is_feedback_requested !== undefined) setIsFeedbackRequested(custom.is_feedback_requested);
                  } catch (e) {
                    console.error("Custom data parse error", e);
                  }
                }
                
                if (project.scheduled_at) {
                    const date = new Date(project.scheduled_at);
                    const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
                    setScheduledAt(localIso);
                }
                
                // Load feedback settings if available
                if (project.allow_michelin_rating !== undefined) setAllowMichelinRating(project.allow_michelin_rating);
                if (project.allow_stickers !== undefined) setAllowStickers(project.allow_stickers);
                if (project.allow_secret_comments !== undefined) setAllowSecretComments(project.allow_secret_comments);
            }
        } catch (error) {
          console.error("Load project error:", error);
          toast.error("프로젝트 정보를 불러오는데 실패했습니다.");
          return; // Stop further processing if failed
        }
      }

      // Check for imported content from AI Tools (Lean Canvas, etc)
      const importedContent = localStorage.getItem('project_import_content');
      const importedTitle = localStorage.getItem('project_import_title');
      const importType = localStorage.getItem('project_import_type');
      
      if (importedContent && !editId && !isVersionMode) {
          if (confirm('AI 기획 도구에서 작성된 내용이 있습니다. 프로젝트에 적용하시겠습니까?')) {
              setTitle(importedTitle || '');
              
              // Simple Markdown to HTML conversion for initial load
              const html = importedContent
                .replace(/### (.*?)\n/g, '<h3>$1</h3>')
                .replace(/## (.*?)\n/g, '<h2>$1</h2>')
                .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" /><br/>')
                .replace(/\n\n/g, '<br/><br/>')
                .replace(/\n/g, '<br/>');

              const typeLabel = importType === 'persona' ? 'AI 페르소나 정의' : 'AI 린 캔버스 기획';
              const finalHtml = `<h2>🚀 ${typeLabel}: ${importedTitle || 'Untitled'}</h2><br/>` + html;
              
              setContent(finalHtml);
              
              // Clear import data
              localStorage.removeItem('project_import_content');
              localStorage.removeItem('project_import_title');
              localStorage.removeItem('project_import_type');
              return; // Skip draft loading if import used
          } else {
             localStorage.removeItem('project_import_content');
             localStorage.removeItem('project_import_title');
          }
      }

      // 로컬스토리지에서 임시 저장된 데이터 복구 (신규 작성 시에만 - imported가 없거나 거절했을 때)
      if (!editId && !isVersionMode) {
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
      }

      // 사용자 관심사 로드 (신규 작성 시에만)
      if (!editId && !isVersionMode) {
        try {
            const { data: userData } = await supabase
            .from('users') // 'profiles'가 맞을 수도 있으나 기존 코드 존중 ('users' view possibly)
            .select('interests') // profiles 테이블이면 'interests' 컬럼 확인 필요.
            // 일단 기존 코드가 'users'였으면 그대로 둠, 하지만 보통 profiles임. 
            // 여기서는 기존 코드 로직을 그대로 복원합니다.
            .eq('id', user.id)
            .single();

            if (userData) {
            const interests = (userData as any).interests;
            // setGenre/Fields logic
            if (interests) {
                 if (interests.genres) setSelectedGenres(interests.genres);
                 if (interests.fields) setSelectedFields(interests.fields);
            }
            }
        } catch (error) {
            // console.error("관심사 로드 실패:", error); // 무시
        }
      }
    };
    
    init();
  }, [projectIdParam, editId, isVersionMode, router]);

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
    setSelectedGenres(prev => {
      if (prev.includes(id)) return prev.filter(g => g !== id);
      if (prev.length >= 5) {
        toast.error('장르는 최대 5개까지 선택할 수 있습니다.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleField = (id: string) => {
    setSelectedFields(prev => {
      if (prev.includes(id)) return prev.filter(f => f !== id);
      if (prev.length >= 3) {
        toast.error('분야는 최대 3개까지 선택할 수 있습니다.');
        return prev;
      }
      return [...prev, id];
    });
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

    if (isVersionMode) {
        if (!finalTitle.trim()) { toast.error('버전 이름을 입력해주세요.'); return; }
        
        setIsSubmitting(true);
        try {
            // Extract images from content
            // Note: Since we are in browser, DOMParser is available.
            // But content is HTML string.
            // Extract images
            const imgRegex = /<img[^>]+src="([^">]+)"/g;
            const images = [];
            let match;
            while ((match = imgRegex.exec(content)) !== null) {
              images.push(match[1]);
            }
            
            // Clean text (strip tags)
            const tmp = document.createElement("DIV");
            tmp.innerHTML = content;
            const plainText = tmp.textContent || "";
            
            // Get session token for secure API call (matches backend requirement)
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch(`/api/projects/${projectIdParam}/versions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    version_name: finalTitle,
                    content_html: content,
                    content_text: plainText, 
                    images: images,
                    changelog: finalSummary
                })
            });
            
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '버전 배포 실패');
            }
            
            toast.success('새 버전이 성공적으로 배포되었습니다! 🚀');
            router.push(`/project/${projectIdParam}`);
        } catch(e: any) {
            console.error(e);
            toast.error(e.message || '버전 배포 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
        return;
    }

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
      // 첫 번째 선택된 장르를 메인 카테고리로 설정 (1:1 매핑)
      let category_id = 1;

      if (finalGenres.length > 0) {
         // GENRE_TO_CATEGORY_ID는 이제 1~12 사이의 정확한 ID를 리턴함
         category_id = GENRE_TO_CATEGORY_ID[finalGenres[0]] || 1;
      }
      
      const url = editId ? `/api/projects/${editId}` : '/api/projects';
      const method = editId ? 'PUT' : 'POST';

      // Get session token for secure API call
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user_id: userId,
          category_id,
          title: finalTitle,
          summary: finalSummary, // API에서 처리하는지 확인 필요, 없으면 무시됨
          description: finalSummary, // description으로도 보냄 (API 호환성)
          content_text: content, // Tiptap HTML content
          collaborator_emails: !editId ? collaboratorEmails : [], // [New] 신규 프로젝트 생성 시 공동 제작자 추가
          thumbnail_url: coverUrl, // URL Update
          rendering_type: 'rich_text',
          allow_michelin_rating: allowMichelinRating,
          allow_stickers: allowStickers,
          allow_secret_comments: allowSecretComments,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null, // [New] Scheduled Publishing
          visibility: visibility, // [New] Visibility Setting
          custom_data: JSON.stringify({
            genres: finalGenres,
            fields: finalFields,
            tags: finalTags, 
            is_feedback_requested: isFeedbackRequested,
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

  // AI Generation Mockups
  const generateTitleWithAi = () => {
    setIsAiGeneratingTitle(true);
    // Simulate AI thinking
    setTimeout(() => {
      const examples = isVersionMode 
        ? ["v1.2: 다크모드 지원 및 UI 최적화", "v2.0: 대규모 엔진 업데이트", "v1.1: 버그 픽스 및 성능 개선"]
        : ["디지털 네이티브를 위한 미래 지향적 플랫폼", "미니멀리즘으로 재해석한 현대 건축", "비주얼 스토리텔링의 새로운 지평"];
      const random = examples[Math.floor(Math.random() * examples.length)];
      setTitle(random);
      setIsAiGeneratingTitle(false);
      toast.success("AI가 창의적인 제목을 제안했습니다! ✨");
    }, 1500);
  };

  const generateSummaryWithAi = () => {
    setIsAiGeneratingSummary(true);
    setTimeout(() => {
      const examples = isVersionMode
        ? ["사용자 피드백을 반영하여 전체적인 사용성을 개선했습니다.", "핵심 렌더링 엔진을 고도화하여 속도를 2배 높였습니다.", "새로운 디자인 시스템을 적용하여 일관성을 확보했습니다."]
        : ["이 프로젝트는 현대 사회의 고립을 예술적으로 풀어낸 실험적 시도입니다.", "기술과 예술의 경계를 허무는 인터랙티브 비주얼을 선보입니다.", "지속 가능한 미래를 위한 디자인 철학을 담은 포트폴리오입니다."];
      const random = examples[Math.floor(Math.random() * examples.length)];
      setSummary(random);
      setIsAiGeneratingSummary(false);
      toast.success("AI가 내용을 풍성하게 요약했습니다! ✍️");
    }, 1500);
  };

  // --- Sidebar Handlers ---
  const handleAddText = () => {
    editor?.chain().focus().insertContent('<p>새로운 텍스트를 입력하세요...</p>').run();
  };

  const handleSidebarImageClick = () => {
    sidebarFileInputRef.current?.click();
  };

  const handleSidebarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && editor) {
      try {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        const urls = await Promise.all(imageFiles.map(file => uploadImage(file)));
        
        if (urls.length > 0) {
           editor.chain().focus().run();
           const html = urls.map(url => `<img src="${url}" />`).join('<p></p>');
           editor.chain().focus().insertContent(html).run();
        }
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

  if (step === 'info') {
    return <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 py-12 px-4 transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-4">
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
                {isVersionMode ? "새 버전 배포 설정" : "발행 설정"}
               </h1>
               <p className="text-sm text-gray-500 mt-1">
                 {isVersionMode ? "업데이트 내용을 요약해주세요" : "프로젝트의 마지막 디테일을 채워주세요"}
               </p>
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
                 
                 </div>
              </div>
            </div>

            {/* 공동 제작자 관리 (Layout Fix: Separated from Cover Image) */}
            <div className="space-y-4">
               <label className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                 </div>
                 공동 제작자 관리
               </label>
               <div className="bg-white p-2 rounded-2xl border border-gray-100">
                  <CollaboratorManager 
                      projectId={editId || undefined} 
                      initialCollaborators={collaboratorEmails}
                      onChange={setCollaboratorEmails} 
                  />
               </div>
            </div>

            <div className="w-full h-px bg-gray-100"></div>

            {/* 제목 */}
            <div className="space-y-3 relative group">
              <div className="flex items-center justify-between">
                <label className="text-xl font-bold text-gray-900">
                  {isVersionMode ? "버전 이름 (예: v1.1)" : "프로젝트 제목"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <button 
                  onClick={generateTitleWithAi}
                  disabled={isAiGeneratingTitle}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-full text-[10px] font-black tracking-widest uppercase border border-purple-100 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faWandMagicSparkles} className={`w-3 h-3 ${isAiGeneratingTitle ? 'animate-spin' : ''}`} />
                  {isAiGeneratingTitle ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={isVersionMode ? "v1.1 대규모 업데이트" : "멋진 프로젝트의 이름을 지어주세요"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`text-2xl h-16 px-6 font-bold border-2 border-gray-200 focus:border-green-500 rounded-xl transition-all placeholder:font-normal placeholder:text-gray-300 ${isAiGeneratingTitle ? 'animate-pulse bg-purple-50/20 ring-2 ring-purple-100' : ''}`}
                />
                {isAiGeneratingTitle && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce delay-0" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-150" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce delay-300" />
                  </div>
                )}
              </div>
            </div>

            {/* 한줄 소개 */}
            <div className="space-y-3 relative group">
              <div className="flex items-center justify-between">
                <label className="text-xl font-bold text-gray-900">
                  {isVersionMode ? "변경 사항 요약 (Changelog)" : "한줄 소개"}
                  <span className="text-sm font-normal text-gray-400 ml-2">(선택)</span>
                </label>
                <button 
                  onClick={generateSummaryWithAi}
                  disabled={isAiGeneratingSummary}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black tracking-widest uppercase border border-indigo-100 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faWandMagicSparkles} className={`w-3 h-3 ${isAiGeneratingSummary ? 'animate-spin' : ''}`} />
                  {isAiGeneratingSummary ? 'Summarizing...' : 'AI Summary'}
                </button>
              </div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="작품을 한 문장으로 소개해 주세요. (상세 페이지 댓글 상단에 표시됩니다)"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className={`text-lg h-14 px-6 font-medium border-2 border-gray-200 focus:border-green-500 rounded-xl transition-all placeholder:text-gray-300 ${isAiGeneratingSummary ? 'animate-pulse bg-indigo-50/20 ring-2 ring-indigo-100' : ''}`}
                />
                {isAiGeneratingSummary && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-0" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-150" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce delay-300" />
                  </div>
                )}
              </div>
            </div>

            {!isVersionMode && (
              <>
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
              </>
            )}

            <div className="w-full h-px bg-gray-100 my-10"></div>

            {/* 공개 범위 설정 */}
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                  <FontAwesomeIcon icon={faRocket} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">공개 범위</h3>
                  <p className="text-xs text-gray-500">프로젝트를 누구에게 보여줄지 선택하세요</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    value: 'public' as const,
                    title: '전체 공개',
                    desc: '모든 사람이 볼 수 있습니다',
                    icon: '🌍',
                  },
                  {
                    value: 'unlisted' as const,
                    title: '링크만 공개 (피드백 전용)',
                    desc: '메인에 노출되지 않으며, 링크 공유로 피드백을 받을 수 있습니다',
                    icon: '🔗',
                  },
                  {
                    value: 'private' as const,
                    title: '비공개',
                    desc: '나만 볼 수 있습니다',
                    icon: '🔒',
                  },
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setVisibility(option.value)}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 select-none ${
                      visibility === option.value
                        ? 'border-purple-500 bg-white shadow-md shadow-purple-100'
                        : 'border-transparent bg-white/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        visibility === option.value ? 'bg-purple-100' : 'bg-gray-100 grayscale'
                      }`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-sm ${
                          visibility === option.value ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {option.title}
                        </h4>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                          {option.desc}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        visibility === option.value
                          ? 'border-purple-500 bg-purple-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {visibility === option.value && <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 피드백 설정 섹션 (Growth Mode Toggle) */}
            <div className={`mb-12 transition-all duration-300 ${isFeedbackRequested ? 'p-8 bg-green-50/30 border-2 border-green-500/30' : 'p-6 bg-gray-50 border border-gray-200'} rounded-3xl`}>
               <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isFeedbackRequested ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          <FontAwesomeIcon icon={faRocket} className="w-4 h-4" />
                       </div>
                       성장하기 (피드백 요청)
                    </h3>
                    <p className="text-sm text-gray-500">다른 크리에이터들에게 작품을 공개하고 피드백을 받아보세요.</p>
                 </div>
                 
                 {/* Master Toggle */}
                 <button
                   type="button"
                   onClick={() => setIsFeedbackRequested(!isFeedbackRequested)}
                   className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                     isFeedbackRequested ? 'bg-green-600' : 'bg-gray-300'
                   }`}
                 >
                   <span
                     className={`${
                       isFeedbackRequested ? 'translate-x-7' : 'translate-x-1'
                     } inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm`}
                   />
                 </button>
               </div>
               
               {isFeedbackRequested && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                   {[
                     { 
                       id: 'michelin', 
                       title: '미슐랭 평점', 
                       desc: '별점을 통해 객관적인 평가를 받습니다.', 
                       icon: '⭐', 
                       status: allowMichelinRating, 
                       setter: setAllowMichelinRating 
                     },
                     { 
                       id: 'stickers', 
                       title: '스티커 투표', 
                       desc: '간단한 이모지로 반응을 수집합니다.', 
                       icon: '🗳️', 
                       status: allowStickers, 
                       setter: setAllowStickers 
                     },
                     { 
                       id: 'secret', 
                       title: '비밀 제안/댓글', 
                       desc: '프라이빗한 피드백과 제안을 허용합니다.', 
                       icon: '🔒', 
                       status: allowSecretComments, 
                       setter: setAllowSecretComments 
                     }
                   ].map((opt) => (
                     <div 
                       key={opt.id}
                       onClick={() => opt.setter(!opt.status)}
                       className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 select-none ${
                         opt.status 
                           ? 'border-green-500 bg-white shadow-md shadow-green-100' 
                           : 'border-transparent bg-white/50 hover:bg-white text-gray-400'
                       }`}
                     >
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${opt.status ? 'bg-green-100' : 'bg-gray-100 grayscale'}`}>
                             {opt.icon}
                          </div>
                          <div className="flex-1">
                             <h4 className={`font-bold text-sm ${opt.status ? 'text-gray-900' : 'text-gray-500'}`}>{opt.title}</h4>
                             <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{opt.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${opt.status ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                             {opt.status && <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />}
                          </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            <div className="w-full h-px bg-gray-100 my-8"></div>

            {/* [New] Project Evolution Timeline Preview (Editable) */}
            <div className="mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                     <FontAwesomeIcon icon={faRocket} className="w-5 h-5 transition-transform hover:scale-110" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">Project Evolution</h3>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Timeline Preview (Editable)</p>
                  </div>
               </div>

               <div className="relative p-10 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                     <FontAwesomeIcon icon={faRocket} className="w-40 h-40 text-black rotate-12" />
                  </div>
                  
                  <div className="relative z-10 space-y-12">
                     {/* Upcoming New Version (The one being created, Editable) */}
                     <div className="relative pl-12 h-auto min-h-[5rem]">
                        <div className="absolute left-1 top-0 bottom-[-48px] w-px bg-gradient-to-b from-blue-500 via-blue-200 to-gray-100"></div>
                        <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100 animate-pulse"></div>
                        
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                           <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                 {/* Editable Title */}
                                 <input 
                                   type="text"
                                   value={title}
                                   onChange={(e) => setTitle(e.target.value)}
                                   placeholder="새 버전 이름 (예: v1.0)"
                                   className="text-lg font-black text-gray-900 bg-transparent border-none focus:ring-0 p-0 placeholder:text-gray-300 w-full"
                                 />
                                 <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase tracking-tighter shadow-sm whitespace-nowrap">NEW RELEASE</span>
                              </div>
                              {/* Editable Summary (Textarea) */}
                              <textarea 
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="이번 업데이트의 핵심 내용을 적어주세요."
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-500 font-medium italic leading-relaxed resize-none h-auto min-h-[3rem] placeholder:text-gray-300 placeholder:not-italic"
                                rows={2}
                              />
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-black text-gray-400 border border-gray-200 px-2 py-1 rounded-lg">COMING SOON</span>
                           </div>
                        </div>
                     </div>

                     {/* Existing Versions */}
                     {versions && versions.length > 0 ? (
                        versions.map((ver, idx) => (
                          <div key={ver.id || idx} className="relative pl-12 opacity-50 grayscale-[0.5] hover:opacity-80 transition-all duration-300">
                             {idx !== versions.length - 1 && (
                               <div className="absolute left-1 top-0 bottom-[-48px] w-px bg-gray-200"></div>
                             )}
                             <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-gray-300 ring-4 ring-gray-100"></div>
                             
                             <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2">
                                      <h5 className="text-base font-bold text-gray-700">{ver.version_name}</h5>
                                      {idx === 0 && <span className="px-1.5 py-0.5 border border-gray-300 text-[8px] font-bold text-gray-400 rounded">CURRENT LATEST</span>}
                                   </div>
                                   <p className="text-xs text-gray-400 leading-relaxed max-w-xl">{ver.changelog || "변경 사항 요약 없음"}</p>
                                </div>
                                <div className="text-right">
                                   <span className="text-[10px] font-bold text-gray-400 tabular-nums">{ver.created_at ? new Date(ver.created_at).toLocaleDateString() : '2024.xx.xx'}</span>
                                </div>
                             </div>
                          </div>
                        ))
                     ) : (
                        <div className="relative pl-12 opacity-30">
                           <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-gray-200 ring-4 ring-gray-100"></div>
                           <h4 className="text-base font-bold text-gray-400 truncate">Initial Version (v1.0)</h4>
                           <p className="text-xs text-gray-400 italic">이전 배포 이력이 없습니다.</p>
                        </div>
                     )}
                  </div>
               </div>
               <p className="text-center mt-6 text-[10px] text-gray-400 font-medium bg-white/50 py-2 rounded-full border border-dashed border-gray-100">배포 시 위와 같은 타임라인이 프로필 상세 페이지의 [로켓] 버튼 툴팁에 동적으로 반영됩니다.</p>
            </div>

            {/* [New] Previous Content Quick Reference (Accordion) */}
            {isVersionMode && previousContent && (
               <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                  <details className="group border-2 border-amber-100 rounded-[2.5rem] overflow-hidden bg-white/40">
                     <summary className="flex items-center justify-between p-8 cursor-pointer list-none hover:bg-amber-50/30 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                              <FontAwesomeIcon icon={faFileLines} className="w-5 h-5" />
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-gray-900 leading-tight">이전 배포 내용 참조</h4>
                              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Original Content View</p>
                           </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white border border-amber-200 flex items-center justify-center text-amber-500 group-open:rotate-180 transition-transform">
                           <span className="text-xs">▼</span>
                        </div>
                     </summary>
                     <div className="p-10 border-t border-amber-50 bg-white/80 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <div className="prose prose-sm max-w-none text-gray-500 opacity-60 pointer-events-none select-all filter contrast-[0.8]">
                           <div dangerouslySetInnerHTML={{ __html: previousContent }} />
                        </div>
                     </div>
                  </details>
               </div>
            )}

            {/* 예약 발행 설정 UI */}
            <div className="flex justify-end mb-4">
               <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:border-green-400 transition-colors">
                  <label htmlFor="scheduled-at" className="text-sm font-bold text-gray-700 flex items-center gap-2 cursor-pointer select-none">
                     <FontAwesomeIcon icon={faClock} className={scheduledAt ? "text-green-600" : "text-gray-400"} />
                     <span className={scheduledAt ? "text-green-700" : ""}>{scheduledAt ? "예약됨" : "예약 발행 설정"}</span>
                  </label>
                  <input 
                     type="datetime-local" 
                     id="scheduled-at"
                     step="1"
                     value={scheduledAt}
                     onChange={(e) => setScheduledAt(e.target.value)}
                     className="bg-transparent border border-gray-100 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:border-green-500 transition-colors"
                  />
                  {scheduledAt && (
                     <button 
                        onClick={() => setScheduledAt('')}
                        className="text-xs text-red-500 hover:text-red-700 ml-2 font-medium"
                        title="예약 취소"
                     >
                        취소
                     </button>
                  )}
               </div>
            </div>

            {/* 발행 버튼 */}
            <div className="flex justify-end gap-4">
               <button
                  onClick={() => setStep('content')}
                  className="px-8 py-4 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
               >
                 취소
               </button>
               <Button
                onClick={() => handleSubmit()}
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
                    {isVersionMode ? "버전 배포하기" : "프로젝트 발행하기"}
                  </span>
                )}
              </Button>
            </div>
          </div>
      </div>;
  }

  // Content Step
  return (
    <div className="w-full min-h-screen bg-gray-100">
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
              <h2 className="text-lg font-bold text-gray-900">
                  {isVersionMode ? (
                      <span className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">New Version</span>
                        <span className="truncate max-w-[200px] text-gray-700">{originalProjectTitle}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-black">{title || "버전 이름 입력 대기..."}</span>
                      </span>
                  ) : (title || "새 프로젝트")}
              </h2>
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
              {/* [New] AI Planner Button */}
              <Button
                variant="outline"
                className="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 gap-2 h-10 px-4 rounded-full font-bold transition-all hover:scale-105"
                onClick={() => setLeanCanvasOpen(true)}
              >
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4" />
                AI 기획
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

        {/* [New] Left Sidebar (Version Control) */}
        {isVersionMode && (
           <div className="hidden xl:flex flex-col w-[320px] flex-shrink-0 gap-6 sticky top-28 h-fit animate-in fade-in slide-in-from-left-4">
              {/* 1. Version Info Input */}
              <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                 <div>
                    <label className="text-xs font-black text-blue-600 mb-2 block uppercase tracking-wider">New Version Name</label>
                    <Input 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="예) v1.2 다크모드 업데이트"
                      className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                 </div>
                 <div className="text-[10px] text-gray-400 leading-relaxed">
                    * 버전 이름은 사용자들에게 노출되는 업데이트 타이틀입니다.
                 </div>
              </div>

              {/* 2. Previous Version Toggle */}
              <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                 <button 
                   onClick={() => setShowOriginal(!showOriginal)}
                   className={`w-full flex items-center justify-between p-5 transition-colors ${showOriginal ? 'bg-amber-50 text-amber-700' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                 >
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center ${showOriginal ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-400'}`}>
                          <FontAwesomeIcon icon={faFileLines} className="w-3.5 h-3.5" />
                       </div>
                       <span className="font-bold text-sm">이전 내용 참고하기</span>
                    </div>
                    <FontAwesomeIcon icon={showOriginal ? faCheck : faArrowLeft} className={`w-3 h-3 transition-transform ${showOriginal ? '' : 'rotate-180'}`} />
                 </button>

                 {/* 3. Reference Viewer */}
                 {showOriginal && (
                    <div className="border-t border-amber-100 bg-amber-50/30 p-5 animate-in slide-in-from-top-2 duration-300">
                       <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Original Reference</span>
                          <span className="text-[10px] text-gray-400">Read Only</span>
                       </div>
                       <div className="bg-white rounded-xl border border-amber-100 p-4 max-h-[400px] overflow-y-auto custom-scrollbar shadow-inner">
                          <div className="prose prose-sm max-w-none text-gray-500 text-xs opacity-80 pointer-events-none select-none grayscale-[0.5]">
                             <div dangerouslySetInnerHTML={{ __html: previousContent || "<p class='text-center text-gray-300 py-4'>이전 버전 내용이 없습니다.</p>" }} />
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        )}
        
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
           <div className="sticky top-32 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar pr-2">
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
           
           {/* Hidden File Input for Sidebar (Multi Image) */}
           <input 
             type="file"
             ref={sidebarFileInputRef}
             className="hidden"
             accept="image/*"
             multiple
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
      <LeanCanvasModal
        open={leanCanvasOpen}
        onOpenChange={setLeanCanvasOpen}
        onApply={handleLeanCanvasApply}
      />
    </div>
  );
}
