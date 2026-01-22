"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
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
  faUser,
  faImage,
  faPlus,
  faTrash,
  faLightbulb,
  faLink,
  faArrowRight,
  faBullseye as faTarget,
  faSquarePollVertical,
  faCircleQuestion,
  faQuoteLeft
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
  const isGrowthMode = mode === 'growth';

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
  const [isFeedbackRequested, setIsFeedbackRequested] = useState(isGrowthMode); // [Growth Mode]
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

  // V-Audit States
  const [auditType, setAuditType] = useState<'link' | 'image' | 'video'>('link');
  const [mediaData, setMediaData] = useState<any>(null);
  const [mediaDataB, setMediaDataB] = useState<any>(null);
  const [isAB, setIsAB] = useState(false);
  const [auditDeadline, setAuditDeadline] = useState<string>("");
  const [isGrowthRequested, setIsGrowthRequested] = useState(isGrowthMode);
  const [customCategories, setCustomCategories] = useState<any[]>([
    { id: 'score_1', label: '기획력', icon: 'Lightbulb', color: '#f59e0b', desc: '논리적 구조와 의도' },
    { id: 'score_2', label: '완성도', icon: 'Zap', color: '#3b82f6', desc: '디테일과 마감 수준' },
    { id: 'score_3', label: '독창성', icon: 'Target', color: '#10b981', desc: '작가 고유의 스타일' },
    { id: 'score_4', label: '상업성', icon: 'TrendingUp', color: '#ef4444', desc: '시장 가치와 잠재력' }
  ]);
  const [pollOptions, setPollOptions] = useState<any[]>([
    { id: 'opt_1', label: "합격입니다. 당장 쓸게요.", icon: 'CheckCircle2', image_url: 'https://cdn-icons-png.flaticon.com/512/5290/5290058.png', desc: '시장에 바로 출시 가능하며 즉시 사용 가치가 검증된 프로젝트' },
    { id: 'opt_2', label: "보류하겠습니다.", icon: 'Clock', image_url: 'https://cdn-icons-png.flaticon.com/512/5290/5290076.png', desc: '기획은 좋으나 디테일이나 UI/UX 측면의 보완이 필요한 경우' },
    { id: 'opt_3', label: "불합격드리겠습니다.", icon: 'XCircle', image_url: 'https://cdn-icons-png.flaticon.com/512/5290/5290117.png', desc: '컨셉의 전면적인 재검토나 핵심 기능의 재정의가 필요한 상태' }
  ]);
  const [pollDesc, setPollDesc] = useState<string>("");
  const [auditQuestions, setAuditQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (isGrowthMode && auditQuestions.length === 0) {
      setAuditQuestions([""]);
    }
  }, [isGrowthMode, auditQuestions.length]);

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
              // Fix: Removed 'Category' join to avoid PGRST201 (Ambiguous embedding) error.
              // We don't use Category name here, only category_id which is in Project table.
              .select('*')
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
                    if (custom.poll_desc) setPollDesc(custom.poll_desc);
                    
                    // V-Audit Data Load
                    if (custom.audit_type) setAuditType(custom.audit_type);
                    if (custom.media_data) setMediaData(custom.media_data);
                    if (custom.media_data_b) setMediaDataB(custom.media_data_b);
                    if (custom.is_ab !== undefined) setIsAB(custom.is_ab);
                    if (project.audit_deadline) setAuditDeadline(new Date(project.audit_deadline).toISOString().slice(0, 16));
                    if (project.is_growth_requested !== undefined) setIsGrowthRequested(project.is_growth_requested);
                    if (custom.custom_categories) setCustomCategories(custom.custom_categories);
                    if (custom.poll_options) setPollOptions(custom.poll_options);
                    if (custom.audit_questions) setAuditQuestions(custom.audit_questions);
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
                    content_text: content, // Send HTML to update main Project table correctly
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
            // V-Audit Data Store
            audit_type: auditType,
            media_data: mediaData,
            media_data_b: mediaDataB,
            is_ab: isAB,
            custom_categories: customCategories,
            poll_options: pollOptions,
            poll_desc: pollDesc,
            audit_questions: auditQuestions,
          }),
          audit_deadline: auditDeadline ? new Date(auditDeadline).toISOString() : null,
          is_growth_requested: isGrowthRequested,
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
              <span className="text-sm font-medium">{isGrowthMode ? "이전 단계로" : "에디터로 돌아가기"}</span>
            </button>
            <div className="text-right">
               <h1 className="text-3xl font-black text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                {isVersionMode ? "새 버전 배포 설정" : isGrowthMode ? "평가 게시 설정" : "발행 설정"}
               </h1>
               <p className="text-sm text-gray-500 mt-1">
                 {isVersionMode ? "업데이트 내용을 요약해주세요" : isGrowthMode ? "내 작품의 진단 항목을 확인하고 게시해주세요" : "프로젝트의 마지막 디테일을 채워주세요"}
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

            {/* 피드백 설정 섹션 (V-Audit Configuration) */}
            <div className={`mb-12 transition-all duration-300 ${isFeedbackRequested ? 'p-8 bg-slate-900 text-white shadow-2xl' : 'p-6 bg-gray-50 border border-gray-200'} rounded-[2.5rem]`}>
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg", isFeedbackRequested ? "bg-green-500 text-white" : "bg-white text-gray-400")}>
                      🚀
                    </div>
                    <div>
                      <h3 className={cn("text-2xl font-black tracking-tight", isFeedbackRequested ? "text-white" : "text-gray-900")}>V-Audit 활성화</h3>
                      <p className={cn("text-sm font-medium", isFeedbackRequested ? "text-slate-400" : "text-gray-500")}>전문가 및 타겟 그룹으로부터 정밀 피드백을 수집합니다</p>
                    </div>
                 </div>
                 <button 
                   type="button"
                   onClick={() => setIsFeedbackRequested(!isFeedbackRequested)}
                   className={cn(
                     "w-16 h-8 rounded-full transition-all relative flex items-center px-1 shadow-inner",
                     isFeedbackRequested ? "bg-green-500" : "bg-gray-200"
                   )}
                 >
                    <div className={cn("w-6 h-6 bg-white rounded-full shadow-md transition-transform", isFeedbackRequested ? "translate-x-8" : "translate-x-0")} />
                 </button>
               </div>

               {isFeedbackRequested && (
                 <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* 1. Media Type & A/B Toggle */}
                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <label className="text-sm font-black text-slate-400 uppercase tracking-widest">진단 미디어 설정</label>
                          <button 
                            type="button"
                            onClick={() => setIsAB(!isAB)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all",
                              isAB ? "bg-amber-500 text-white shadow-lg" : "bg-white/10 text-slate-500 border border-white/10"
                            )}
                          >
                             <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
                             {isAB ? "A/B Testing Active" : "Enable A/B Test"}
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'link', label: '웹 라이스트 (URL)', icon: faCamera },
                            { id: 'image', label: '이미지 갤러리', icon: faCamera },
                            { id: 'video', label: '영상 (Youtube)', icon: faVideo },
                          ].map(t => (
                            <button 
                              key={t.id}
                              type="button"
                              onClick={() => setAuditType(t.id as any)}
                              className={cn(
                                "py-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all font-bold",
                                auditType === t.id ? "bg-white text-black border-green-500 shadow-xl" : "bg-white/10 border-white/10 text-slate-400 hover:bg-white/20"
                              )}
                            >
                               <FontAwesomeIcon icon={t.icon} />
                               <span className="text-xs">{t.label}</span>
                            </button>
                          ))}
                       </div>
                       
                       {/* Media Inputs for Version A */}
                       <div className={cn("p-6 rounded-3xl space-y-4", isAB ? "bg-white/5 border border-white/10" : "")}>
                          {isAB && <span className="text-[10px] font-black text-blue-500 uppercase">Version A</span>}
                          {auditType === 'link' && (
                            <Input 
                              placeholder="버전 A의 URL을 입력하세요"
                              className="bg-white/20 border-white/20 text-white placeholder:text-slate-500 h-12 rounded-xl focus:bg-white/30"
                              defaultValue={typeof mediaData === 'string' ? mediaData : ''}
                              onBlur={(e) => setMediaData(e.target.value)}
                            />
                          )}
                          
                          {auditType === 'video' && (
                            <Input 
                              placeholder="버전 A의 유튜브 URL을 입력하세요"
                              className="bg-white/20 border-white/20 text-white placeholder:text-slate-500 h-12 rounded-xl focus:bg-white/30"
                              defaultValue={typeof mediaData === 'string' ? mediaData : ''}
                              onBlur={(e) => setMediaData(e.target.value)}
                            />
                          )}

                          {auditType === 'image' && (
                            <div className="space-y-3">
                               <div className="flex flex-wrap gap-2">
                                  {Array.isArray(mediaData) && mediaData.map((url, idx) => (
                                    <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                                       <img src={url} className="w-full h-full object-cover" />
                                       <button 
                                         onClick={() => setMediaData(mediaData.filter((_, i) => i !== idx))}
                                         className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                       >
                                         <span className="text-white font-bold">×</span>
                                       </button>
                                    </div>
                                  ))}
                                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/5">
                                     <FontAwesomeIcon icon={faUpload} className="text-slate-500" />
                                     <input 
                                       type="file" 
                                       multiple 
                                       className="hidden" 
                                       onChange={async (e) => {
                                         const files = e.target.files;
                                         if (!files) return;
                                         const urls = await Promise.all(Array.from(files).map(f => uploadImage(f)));
                                         setMediaData([...(Array.isArray(mediaData) ? mediaData : []), ...urls]);
                                       }}
                                     />
                                  </label>
                               </div>
                            </div>
                          )}
                       </div>

                       {/* Media Inputs for Version B (Conditional) */}
                       {isAB && (
                         <div className="p-6 rounded-3xl space-y-4 bg-amber-500/5 border border-amber-500/20">
                            <span className="text-[10px] font-black text-amber-500 uppercase">Version B</span>
                            {auditType === 'link' && (
                              <Input 
                                placeholder="버전 B의 URL을 입력하세요"
                                className="bg-white/20 border-white/20 text-white placeholder:text-slate-500 h-12 rounded-xl focus:bg-white/30"
                                defaultValue={typeof mediaDataB === 'string' ? mediaDataB : ''}
                                onBlur={(e) => setMediaDataB(e.target.value)}
                              />
                            )}
                            
                            {auditType === 'video' && (
                              <Input 
                                placeholder="버전 B의 유튜브 URL을 입력하세요"
                                className="bg-white/20 border-white/20 text-white placeholder:text-slate-500 h-12 rounded-xl focus:bg-white/30"
                                defaultValue={typeof mediaDataB === 'string' ? mediaDataB : ''}
                                onBlur={(e) => setMediaDataB(e.target.value)}
                              />
                            )}

                            {auditType === 'image' && (
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(mediaDataB) && mediaDataB.map((url, idx) => (
                                      <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button 
                                          onClick={() => setMediaDataB(mediaDataB.filter((_, i) => i !== idx))}
                                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <span className="text-white font-bold">×</span>
                                        </button>
                                      </div>
                                    ))}
                                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/5">
                                      <FontAwesomeIcon icon={faUpload} className="text-slate-500" />
                                      <input 
                                        type="file" 
                                        multiple 
                                        className="hidden" 
                                        onChange={async (e) => {
                                          const files = e.target.files;
                                          if (!files) return;
                                          const urls = await Promise.all(Array.from(files).map(f => uploadImage(f)));
                                          setMediaDataB([...(Array.isArray(mediaDataB) ? mediaDataB : []), ...urls]);
                                        }}
                                      />
                                    </label>
                                </div>
                              </div>
                            )}
                         </div>
                       )}
                    </div>

                    {/* 2. Custom Categories */}
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <label className="text-sm font-black text-slate-400 uppercase tracking-widest">커스텀 진단 카테고리 (Radar Chart)</label>
                          <Button variant="ghost" size="sm" className="text-green-500 font-bold hover:bg-white/10" onClick={() => {
                             if (customCategories.length < 6) {
                               setCustomCategories([...customCategories, { id: `score_${customCategories.length + 1}`, label: '새 항목', icon: 'Target', color: '#888888', desc: '항목 설명' }]);
                             } else {
                               toast.error("카테고리는 최대 6개까지만 설정 가능합니다.");
                             }
                          }}>+ 항목 추가</Button>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {customCategories.map((cat, idx) => (
                            <div key={cat.id} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 group/cat overflow-hidden relative">
                               <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                  <FontAwesomeIcon icon={faStar} className="text-slate-400 w-4 h-4" />
                               </div>
                               <div className="flex-1">
                                  <input 
                                    value={cat.label}
                                    onChange={(e) => {
                                      const newCats = [...customCategories];
                                      newCats[idx].label = e.target.value;
                                      setCustomCategories(newCats);
                                    }}
                                    className="bg-transparent text-sm font-black text-white outline-none w-full border-b border-white/5 focus:border-green-500"
                                    placeholder="항목 제목"
                                  />
                                  <input 
                                    value={cat.desc}
                                    onChange={(e) => {
                                      const newCats = [...customCategories];
                                      newCats[idx].desc = e.target.value;
                                      setCustomCategories(newCats);
                                    }}
                                    className="bg-transparent text-[10px] font-bold text-slate-500 outline-none w-full"
                                    placeholder="상세 설명"
                                  />
                               </div>
                               {customCategories.length > 3 && (
                                 <button 
                                   type="button" 
                                   onClick={() => setCustomCategories(customCategories.filter((_, i) => i !== idx))} 
                                   className="text-slate-600 hover:text-red-500 px-2 transition-colors"
                                 >
                                   ×
                                 </button>
                               )}
                            </div>
                          ))}
                       </div>
                    </div>

                                         {/* 2.5. Sticker Poll Configuration (New) */}
                     <div className="space-y-6 pt-6 border-t border-white/10">
                        <div className="flex justify-between items-center">
                           <div className="space-y-1">
                              <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                 <FontAwesomeIcon icon={faStar} className="text-amber-400" />
                                 스티커 투표(Sticker Poll) 설정
                              </label>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">의뢰 항목에 맞는 스티커와 디자인을 커스텀하세요 (2~6개)</p>
                           </div>
                           <Button variant="ghost" size="sm" className="text-blue-500 font-bold hover:bg-white/10" onClick={() => {
                              if (pollOptions.length < 6) {
                                setPollOptions([...pollOptions, { id: `opt_${Date.now()}`, label: '새 스티커', desc: '스티커 클릭 시 표시될 설명', icon: 'CheckCircle2' }]);
                              } else {
                                toast.error("스티커는 최대 6개까지만 설정 가능합니다.");
                              }
                           }}>
                              <FontAwesomeIcon icon={faPlus} className="mr-2" /> 항목 추가
                           </Button>
                        </div>

                        {/* Poll Guideline Description */}
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase">전체 투표 안내 문구</label>
                           <Input 
                             value={pollDesc}
                             onChange={(e) => setPollDesc(e.target.value)}
                             placeholder="예: 이 서비스의 초기 모델을 보고 어떤 생각이 드시나요?"
                             className="bg-white/5 border-white/10 text-white text-xs h-10 rounded-xl"
                           />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {pollOptions.map((opt, idx) => (
                             <div key={opt.id} className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4 group/poll relative overflow-hidden">
                                {/* Delete Button */}
                                {pollOptions.length > 2 && (
                                  <button 
                                    type="button"
                                    onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                    className="absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover/poll:opacity-100 transition-opacity"
                                  >
                                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Image Upload / Icon Placeholder */}
                                <div className="flex justify-center">
                                   <div className="relative w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 group/img">
                                      {opt.image_url ? (
                                        <img src={opt.image_url} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="flex flex-col items-center gap-2">
                                           <FontAwesomeIcon icon={faImage} className="text-slate-500 text-2xl" />
                                           <span className="text-[8px] font-black text-slate-600 uppercase">Custom Image</span>
                                        </div>
                                      )}
                                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                         <FontAwesomeIcon icon={faUpload} className="text-white w-5 h-5" />
                                         <input 
                                           type="file" 
                                           className="hidden" 
                                           onChange={async (e) => {
                                             const file = e.target.files?.[0];
                                             if (file) {
                                               const url = await uploadImage(file);
                                               const newOpts = [...pollOptions];
                                               newOpts[idx].image_url = url;
                                               setPollOptions(newOpts);
                                             }
                                           }}
                                         />
                                      </label>
                                   </div>
                                </div>

                                {/* Label & Desc Inputs */}
                                <div className="space-y-3">
                                   <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-600 uppercase">스티커 이름</label>
                                      <input 
                                        value={opt.label}
                                        onChange={(e) => {
                                          const newOpts = [...pollOptions];
                                          newOpts[idx].label = e.target.value;
                                          setPollOptions(newOpts);
                                        }}
                                        className="bg-transparent text-sm font-black text-white w-full border-b border-white/5 focus:border-green-500 outline-none pb-1"
                                        placeholder="이름 입력"
                                      />
                                   </div>
                                   <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-600 uppercase">선택 시 상세 설명</label>
                                      <textarea 
                                        value={opt.desc}
                                        onChange={(e) => {
                                          const newOpts = [...pollOptions];
                                          newOpts[idx].desc = e.target.value;
                                          setPollOptions(newOpts);
                                        }}
                                        className="bg-transparent text-[11px] font-bold text-slate-400 w-full h-12 outline-none resize-none leading-relaxed"
                                        placeholder="이 스티커를 선택했을 때 하단에 표시될 상세 설명을 입력하세요."
                                      />
                                   </div>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* 2.6. Comprehensive Evaluation Custom Questions (New) */}
                     <div className="space-y-6 pt-6 border-t border-white/10">
                        <div className="flex justify-between items-center">
                           <div className="space-y-1">
                              <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                 <FontAwesomeIcon icon={faLightbulb} className="text-yellow-400" />
                                 종합 평가 커스텀 질문
                              </label>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">리뷰어에게 구체적으로 묻고 싶은 질문을 추가하세요 (1~3개)</p>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="text-blue-500 font-bold hover:bg-white/10" 
                             onClick={() => {
                               if (auditQuestions.length < 3) {
                                 setAuditQuestions([...auditQuestions, ""]);
                               } else {
                                 toast.error("질문은 최대 3개까지만 가능합니다.");
                               }
                             }}
                           >
                              <FontAwesomeIcon icon={faPlus} className="mr-2" /> 질문 추가
                           </Button>
                        </div>

                        <div className="space-y-4">
                           {auditQuestions.map((q, idx) => (
                             <div key={idx} className="flex gap-4 items-center">
                                <div className="flex-1 relative">
                                   <Input 
                                     value={q}
                                     onChange={(e) => {
                                       const newQs = [...auditQuestions];
                                       newQs[idx] = e.target.value;
                                       setAuditQuestions(newQs);
                                     }}
                                     placeholder={`질문 ${idx + 1}: 예) 이 앱의 유료 결제 모델에 대해 어떻게 생각하시나요?`}
                                     className="bg-white/5 border-white/10 text-white text-xs h-12 rounded-2xl pl-12"
                                   />
                                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-[10px]">Q{idx + 1}</div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-slate-600 hover:text-red-500"
                                  onClick={() => setAuditQuestions(auditQuestions.filter((_, i) => i !== idx))}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                             </div>
                           ))}
                           {auditQuestions.length === 0 && (
                             <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl text-center">
                                <p className="text-xs font-bold text-slate-600">추가된 커스텀 질문이 없습니다.</p>
                             </div>
                           )}
                        </div>
                     </div>

                     {/* 3. Audit Deadline & Growth Option */}
                    <div className="pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <FontAwesomeIcon icon={faClock} className="text-amber-500" />
                             진단 종료 기한
                          </label>
                          <Input 
                            type="datetime-local"
                            value={auditDeadline}
                            onChange={(e) => setAuditDeadline(e.target.value)}
                            className="bg-white/10 border-white/10 text-white h-12 rounded-2xl focus:ring-green-500"
                          />
                          <p className="text-[10px] text-slate-600">설정된 기한 이후로는 피드백을 받을 수 없습니다.</p>
                       </div>

                       <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <FontAwesomeIcon icon={faRocket} className="text-blue-500" />
                             성장하기(공개 진단) 등록
                          </label>
                          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                             <span className="text-xs font-bold text-slate-400">커뮤니티에 공개하여 피드백 받기</span>
                             <button 
                               type="button"
                               onClick={() => setIsGrowthRequested(!isGrowthRequested)}
                               className={cn(
                                 "w-12 h-6 rounded-full transition-all relative flex items-center px-1 shadow-inner",
                                 isGrowthRequested ? "bg-blue-600" : "bg-white/10"
                               )}
                             >
                                <div className={cn("w-4 h-4 bg-white rounded-full shadow-md transition-transform", isGrowthRequested ? "translate-x-6" : "translate-x-0")} />
                             </button>
                          </div>
                          <p className="text-[10px] text-slate-600">기본값은 '아니오'입니다. 활성 시 메인 페이지 '성장하기' 탭에 노출됩니다.</p>
                       </div>
                    </div>

                    {/* 4. Success Message UI */}
                    <div className="pt-8 border-t border-white/10 flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                          <FontAwesomeIcon icon={faRocket} />
                       </div>
                       <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-lg">
                         V-Audit 모드가 활성화되면 일반적인 포트폴리오 스타일이 아닌, <span className="text-white font-bold">정밀 진단 센터</span> 인터페이스로 발행됩니다. 
                         수집된 데이터는 'My Archive'에서 실시간으로 분석되어 시각화됩니다.
                       </p>
                    </div>
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
                    {isVersionMode ? "버전 배포하기" : isGrowthMode ? "평가 게시하기" : "프로젝트 발행하기"}
                  </span>
                )}
              </Button>
            </div>
          </div>
      </div>;
  }

  if (isGrowthMode && step === 'content') {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] py-12 px-4 md:px-0">
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
           {/* Header with back button */}
           <div className="flex items-center justify-between">
              <button 
                onClick={() => router.push('/')} 
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all group"
              >
                 <FontAwesomeIcon icon={faArrowLeft} className="group-hover:-translate-x-1 transition-transform" />
                 돌아가기
              </button>
              <div className="text-right">
                 <h1 className="text-3xl font-black text-slate-900 tracking-tight">평가 의뢰하기</h1>
                 <p className="text-sm text-slate-500 font-medium">내 아이디어의 가치를 평가받는 가장 빠른 방법</p>
              </div>
           </div>

           {/* Core Setup Card */}
           <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              {/* Media Section */}
              <div className="p-10 md:p-14 border-b border-slate-50">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-600/20">
                       <FontAwesomeIcon icon={faLink} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900">1. 무엇을 평가받고 싶으신가요?</h2>
                       <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Evaluation Media Setup</p>
                    </div>
                 </div>

                 {/* Media Type Toggles */}
                 <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 w-fit space-x-1">
                    {[
                      { id: 'link', label: '웹 링크 URL', icon: faLink },
                      { id: 'video', label: '영상 (유튜브/비메오)', icon: faVideo },
                      { id: 'image', label: '시안 (이미지 갤러리)', icon: faImage },
                    ].map(t => (
                      <button 
                        key={t.id}
                        onClick={() => {
                           setAuditType(t.id as any);
                           setMediaData(null);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all",
                          auditType === t.id ? "bg-white text-indigo-600 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        )}
                      >
                         <FontAwesomeIcon icon={t.icon} />
                         {t.label}
                      </button>
                    ))}
                 </div>

                 {/* Large Input Area */}
                 <div className="relative group">
                    {auditType === 'image' ? (
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Array.isArray(mediaData) && (mediaData as any[]).map((url, idx) => (
                             <div key={idx} className="aspect-square rounded-3xl overflow-hidden border-2 border-slate-100 relative group/img shadow-sm">
                                <img src={url} className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setMediaData((mediaData as any[]).filter((_, i) => i !== idx))} 
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                >
                                   <FontAwesomeIcon icon={faTrash} className="text-white" />
                                </button>
                             </div>
                          ))}
                          <label className="aspect-square rounded-3xl border-3 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group/upload">
                             <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center transition-all group-hover/upload:scale-110 group-hover/upload:bg-white group-hover/upload:text-indigo-500 group-hover/upload:shadow-md">
                                <FontAwesomeIcon icon={faPlus} className="text-xl" />
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter text-center">Add Image</span>
                             <input type="file" multiple className="hidden" onChange={async (e) => {
                                const files = e.target.files;
                                if (!files) return;
                                toast.loading("이미지를 업로드 중입니다...");
                                try {
                                  const urls = await Promise.all(Array.from(files).map(f => uploadImage(f)));
                                  setMediaData([...(Array.isArray(mediaData) ? mediaData : []), ...urls]);
                                  toast.dismiss();
                                  toast.success("이미지가 추가되었습니다.");
                                  // Auto-set cover image if not set
                                  if (!coverPreview && urls[0]) setCoverPreview(urls[0]);
                                } catch (err) {
                                  toast.dismiss();
                                  toast.error("업로드에 실패했습니다.");
                                }
                             }} />
                          </label>
                       </div>
                    ) : (
                       <div className="relative">
                          <Input 
                            placeholder={auditType === 'link' ? "검증받을 웹사이트나 랜딩페이지 주소를 입력하세요 (URL)" : "유튜브 또는 비메오 영상 주소를 입력하세요"}
                            className="h-24 px-10 text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300 shadow-inner"
                            value={typeof mediaData === 'string' ? mediaData : ''}
                            onChange={(e) => setMediaData(e.target.value)}
                          />
                          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none transition-all group-focus-within:text-indigo-500">
                             <FontAwesomeIcon icon={faArrowRight} size="lg" />
                          </div>
                       </div>
                    )}
                 </div>
              </div>



              {/* Goals Section */}
              <div className="p-10 md:p-14 bg-slate-50/50 border-b border-slate-50">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
                          <FontAwesomeIcon icon={faTarget} />
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-slate-900">2. 미슐랭처럼 평가받기</h2>
                          <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Evaluation Metrics (Radar Chart)</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">{customCategories.length}/6</p>
                       <Button 
                         variant="outline" 
                         disabled={customCategories.length >= 6}
                         className="rounded-xl font-black text-xs border-2 border-slate-100 hover:border-amber-500 hover:text-amber-600 transition-all font-pretendard h-10 px-4 shadow-sm bg-white" 
                         onClick={() => {
                            setCustomCategories([...customCategories, { id: `score_${customCategories.length + 1}`, label: '새 항목', icon: 'Target', color: '#888888', desc: '항목 설명' }]);
                         }}
                       >
                         <FontAwesomeIcon icon={faPlus} className="mr-2" /> 추가
                       </Button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {customCategories.map((cat, idx) => (
                       <div key={cat.id} className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm flex items-center gap-4 group/cat hover:border-amber-500 hover:shadow-lg transition-all relative">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover/cat:bg-amber-50 group-hover/cat:text-amber-500 transition-colors">
                             <FontAwesomeIcon icon={faStar} />
                          </div>
                          <div className="flex-1 font-pretendard">
                             <input 
                               value={cat.label}
                               onChange={(e) => {
                                 const newCats = [...customCategories];
                                 newCats[idx].label = e.target.value;
                                 setCustomCategories(newCats);
                               }}
                               className="w-full bg-transparent font-black text-slate-900 border-b border-transparent focus:border-amber-500 outline-none pb-0.5 transition-colors"
                               placeholder="항목 명칭"
                             />
                             <input 
                               value={cat.desc}
                               onChange={(e) => {
                                 const newCats = [...customCategories];
                                 newCats[idx].desc = e.target.value;
                                 setCustomCategories(newCats);
                               }}
                               className="w-full bg-transparent text-[10px] font-bold text-slate-400 outline-none mt-1 uppercase tracking-tighter"
                               placeholder="항목에 대한 간단한 가이드"
                             />
                          </div>
                          {customCategories.length > 3 && (
                             <button 
                               onClick={() => setCustomCategories(customCategories.filter((_, i) => i !== idx))} 
                               className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg border border-red-50 text-slate-300 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover/cat:opacity-100 flex items-center justify-center font-bold z-10"
                             >
                                <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                             </button>
                          )}
                       </div>
                    ))}
                 </div>
              </div>

              {/* Sticker Vote (Poll) Section */}
              <div className="p-10 md:p-14 border-b border-slate-50">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center text-xl shadow-lg shadow-violet-600/20">
                          <FontAwesomeIcon icon={faSquarePollVertical} />
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-slate-900">3. 스티커 투표 항목 설정</h2>
                          <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Sticker Poll (2-6 Options with Icons)</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">{pollOptions.length}/6</p>
                       <Button 
                         variant="outline" 
                         disabled={pollOptions.length >= 6}
                         className="rounded-xl font-black text-xs border-2 border-slate-100 hover:border-violet-600 hover:text-violet-600 transition-all font-pretendard h-10 px-4 shadow-sm bg-white" 
                         onClick={() => {
                            setPollOptions([...pollOptions, { id: `opt_${Date.now()}`, label: '새 투표 항목', image_url: '', desc: '이 항목에 투표할 기준을 적어주세요.' }]);
                         }}
                       >
                         <FontAwesomeIcon icon={faPlus} className="mr-2" /> 추가
                       </Button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pollOptions.map((opt, idx) => (
                       <div key={opt.id} className="bg-slate-50/50 p-8 rounded-[3.5rem] border-2 border-slate-100 shadow-sm relative group/opt hover:border-violet-400 hover:bg-white transition-all">
                          {/* Floating Index Badge */}
                          <div className="absolute -left-3 -top-3 w-12 h-12 rounded-[1.25rem] bg-slate-900 text-white flex flex-col items-center justify-center shadow-xl z-20 border-4 border-white group-hover/opt:bg-violet-600 transition-colors">
                             <span className="text-[8px] font-black uppercase tracking-tighter mb-[-2px] opacity-60">Sticker</span>
                             <span className="text-lg font-black leading-none">{idx + 1}</span>
                          </div>

                          <div className="flex flex-col gap-6 font-pretendard">
                             {/* Image Attachment Area */}
                             <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden border-2 border-dashed border-slate-200 bg-white group-hover/opt:border-violet-100 transition-all">
                                {opt.image_url ? (
                                   <>
                                      <img src={opt.image_url} alt={opt.label} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/opt:opacity-100 flex items-center justify-center transition-opacity">
                                         <button 
                                           onClick={() => {
                                              const newPolls = [...pollOptions];
                                              newPolls[idx].image_url = '';
                                              setPollOptions(newPolls);
                                           }}
                                           className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                         >
                                            <FontAwesomeIcon icon={faTrash} />
                                         </button>
                                      </div>
                                   </>
                                ) : (
                                   <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                                      <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4 group-hover/opt:bg-violet-50 group-hover/opt:text-violet-500 group-hover/opt:scale-110 transition-all border border-slate-100">
                                         <FontAwesomeIcon icon={faCamera} className="text-2xl" />
                                      </div>
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">스티커 이미지 첨부</span>
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          toast.loading("스티커를 업로드 중입니다...");
                                          try {
                                            const url = await uploadImage(file);
                                            const newPolls = [...pollOptions];
                                            newPolls[idx].image_url = url;
                                            setPollOptions(newPolls);
                                            toast.dismiss();
                                            toast.success("스티커가 등록되었습니다.");
                                          } catch (err) {
                                            toast.dismiss();
                                            toast.error("업로드에 실패했습니다.");
                                          }
                                        }}
                                      />
                                   </label>
                                )}
                             </div>

                             <div className="flex flex-col gap-4">
                                <div className="space-y-1">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">항목 명칭</p>
                                   <input 
                                     value={opt.label}
                                     onChange={(e) => {
                                       const newPolls = [...pollOptions];
                                       newPolls[idx].label = e.target.value;
                                       setPollOptions(newPolls);
                                     }}
                                     className="w-full bg-transparent font-black text-slate-900 border-b-2 border-slate-100 focus:border-violet-500 outline-none pb-2 transition-colors text-xl tracking-tight"
                                     placeholder="예: 합격입니다"
                                   />
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">투표 가이드라인</p>
                                   <textarea 
                                     value={opt.desc}
                                     onChange={(e) => {
                                       const newPolls = [...pollOptions];
                                       newPolls[idx].desc = e.target.value;
                                       setPollOptions(newPolls);
                                     }}
                                     rows={2}
                                     className="w-full bg-transparent text-sm font-bold text-slate-500 outline-none resize-none leading-relaxed border-0 focus:ring-0 p-0 mt-1 placeholder:text-slate-300"
                                     placeholder="어떤 기준으로 이 스티커를 선택해야 하는지 리뷰어에게 알려주세요."
                                   />
                                </div>
                             </div>
                          </div>
                          {pollOptions.length > 2 && (
                             <button 
                               onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} 
                               className="absolute -top-3 -right-3 w-10 h-10 rounded-[1.25rem] bg-white shadow-xl border border-red-50 text-slate-300 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover/opt:opacity-100 flex items-center justify-center font-bold z-10"
                             >
                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                             </button>
                          )}
                       </div>
                    ))}
                 </div>
              </div>

              {/* Subjective Questions Section */}
              <div className="p-10 md:p-14 bg-indigo-600/5 border-b border-slate-50">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-lg">
                          <FontAwesomeIcon icon={faCircleQuestion} />
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">4. 시크릿 피드백 질문 (주관식)</h2>
                          <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Custom Subjective Questions (1-3)</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">{auditQuestions.length}/3</p>
                       {auditQuestions.length < 3 && (
                        <Button 
                          variant="outline" 
                          className="rounded-xl font-black text-xs border-2 border-slate-100 hover:border-slate-900 hover:text-slate-900 transition-all font-pretendard h-10 px-4 bg-white shadow-sm" 
                          onClick={() => setAuditQuestions([...auditQuestions, ""])}
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-2" /> 질문 추가
                        </Button>
                       )}
                    </div>
                 </div>

                 <div className="space-y-6">
                    {auditQuestions.map((q, idx) => (
                       <div key={idx} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex items-center gap-8 group/q hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-900 flex flex-col items-center justify-center shrink-0 border border-slate-100 group-hover/q:bg-indigo-600 group-hover/q:text-white group-hover/q:border-indigo-600 transition-all">
                             <span className="text-[8px] font-black uppercase tracking-tighter mb-0.5">Question</span>
                             <span className="text-xl font-black leading-none">{idx + 1}</span>
                          </div>
                          <div className="flex-1 font-pretendard relative">
                             <Input 
                               value={q}
                               onChange={(e) => {
                                 const newQs = [...auditQuestions];
                                 newQs[idx] = e.target.value;
                                 setAuditQuestions(newQs);
                               }}
                               className="w-full bg-transparent font-black text-slate-900 border-0 focus:ring-0 px-0 placeholder:text-slate-200 text-xl tracking-tight"
                               placeholder="리뷰어에게 묻고 싶은 질문을 입력하세요 (예: 이 디자인에서 가장 먼저 개선해야 할 점은?)"
                             />
                          </div>
                          {auditQuestions.length > 1 && (
                             <button 
                               onClick={() => setAuditQuestions(auditQuestions.filter((_, i) => i !== idx))} 
                               className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg border border-red-50 text-slate-300 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover/q:opacity-100 flex items-center justify-center font-bold z-10"
                             >
                                <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                             </button>
                          )}
                          <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none group-hover/q:opacity-10 transition-opacity">
                             <FontAwesomeIcon icon={faQuoteLeft} size="3x" />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="p-10 md:p-14">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          평가 의뢰 프로젝트 제목
                       </label>
                       <Input 
                          placeholder="어떤 프로젝트를 위한 피드백인가요?"
                          className="h-16 px-6 text-lg font-bold border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-pretendard"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          평가 모집 마감일
                       </label>
                       <Input 
                          type="date"
                          className="h-16 px-6 text-lg font-bold border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:bg-white focus:border-rose-500 transition-all font-pretendard"
                          value={auditDeadline}
                          onChange={(e) => setAuditDeadline(e.target.value)}
                       />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-4">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          한줄 가이드 (심사위원 배포용)
                       </label>
                       <Input 
                          placeholder="진단 시 고려해줬으면 하는 핵심 포인트 한줄 (예: 전체적인 분위기와 가독성 위주로 봐주세요)"
                          className="h-16 px-6 text-lg font-bold border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus:bg-white focus:border-amber-500 transition-all font-pretendard"
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                       />
                    </div>
                 </div>
              </div>

              {/* Bottom Nav */}
              <div className="p-10 md:p-14 bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-3xl bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                       <FontAwesomeIcon icon={faRocket} className="text-xl" />
                    </div>
                    <div>
                       <p className="text-sm text-white font-black tracking-tight">전문가들의 날카로운 안목을 맞이할 준비가 되셨나요?</p>
                       <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                          설정된 항목을 바탕으로 심도 깊은 분석 리포트가 생성됩니다. <br className="hidden md:block"/> 
                          기본 정보를 확인하고 <span className="text-green-500 font-bold">마지막 발행 단계</span>로 진입하세요.
                       </p>
                    </div>
                 </div>
                 <Button 
                   size="lg" 
                   onClick={() => {
                      if (!title.trim()) { toast.error("제목을 입력해 주세요."); return; }
                      if (!mediaData) { toast.error("평가받을 작업물을 첨부해 주세요."); return; }
                      setStep('info');
                   }}
                   className="h-20 px-12 rounded-3xl bg-green-500 text-black font-black text-xl hover:bg-green-400 hover:-translate-y-1 transition-all shadow-[0_20px_40px_rgba(34,197,94,0.2)]"
                 >
                    게시 설정 확인하기 <FontAwesomeIcon icon={faArrowRight} className="ml-4" />
                 </Button>
              </div>
           </div>
        </div>
      </div>
    );
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
                  ) : isGrowthMode ? (title || "평가 게시 페이지 (진단 요청)") : (title || "새 프로젝트")}
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
