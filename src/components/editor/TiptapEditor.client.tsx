"use client";

import { useEditor, EditorContent, BubbleMenu, FloatingMenu, Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { CustomImageExtension } from './CustomImageExtension';
import { Link as LinkExtension } from '@tiptap/extension-link';
import { Youtube as YoutubeExtension } from '@tiptap/extension-youtube';
import { Placeholder } from '@tiptap/extension-placeholder';
import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
import { FloatingMenu as FloatingMenuExtension } from '@tiptap/extension-floating-menu';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import Dropcursor from '@tiptap/extension-dropcursor';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  ChevronDown,
  Plus,
  Image as ImageIcon,
  Type,
  Video,
  Grid,
  Code as CodeIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadImage } from '@/lib/supabase/storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// 폰트 옵션
const fontFamilies = [
  { label: '기본', value: '' },
  { label: 'Pretendard', value: 'Pretendard' },
  { label: '나눔고딕', value: 'Nanum Gothic' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
];

// 폰트 크기 옵션
const fontSizes = [
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
];

// 색상 옵션
const textColors = [
  { label: '검정', value: '#000000' },
  { label: '흰색', value: '#FFFFFF' },
  { label: '빨강', value: '#EF4444' },
  { label: '주황', value: '#F97316' },
  { label: '노랑', value: '#EAB308' },
  { label: '초록', value: '#22C55E' },
  { label: '파랑', value: '#3B82F6' },
  { label: '보라', value: '#8B5CF6' },
  { label: '분홍', value: '#EC4899' },
  { label: '회색', value: '#6B7280' },
];

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  onEditorReady?: (editor: Editor) => void;
}

export default function TiptapEditor({ 
  content = '', 
  onChange,
  placeholder = '여기에 프로젝트 내용을 작성하세요...',
  onEditorReady
}: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'block-indicator block-heading',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'block-indicator block-paragraph',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'block-indicator block-code',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'block-indicator block-quote',
          },
        },
      }),
      CustomImageExtension.configure({
        HTMLAttributes: {
          class: 'custom-image',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-green-600 underline hover:text-green-700',
        },
      }),
      YoutubeExtension.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'block-indicator block-video rounded-xl my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      BubbleMenuExtension,
      FloatingMenuExtension,
      // 새로 추가된 확장
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Color.configure({
        types: ['textStyle'],
      }),
      Dropcursor.configure({
        color: '#16A34A',
        width: 2,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-8 py-6 editor-blocks',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            
            setUploading(true);
            uploadImage(file, 'projects')
              .then((url) => {
                 if (coordinates) {
                   view.dispatch(view.state.tr.insert(coordinates.pos, view.state.schema.nodes.image.create({ src: url })));
                 }
              })
              .catch((error) => {
                console.error('Drop upload failed:', error);
                toast.error('이미지 업로드에 실패했습니다.');
              })
              .finally(() => {
                setUploading(false);
              });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Expose editor instance to parent & Handle File Upload Helper
  useEffect(() => {
    if (editor && typeof onEditorReady === 'function') {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Handle image replacement from CustomImageExtension
  useEffect(() => {
    if (!editor) return;

    const handleReplaceImage = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { file, pos } = customEvent.detail;
      
      if (file && typeof pos === 'number') {
        setUploading(true);
        try {
          const url = await uploadImage(file, 'projects');
          editor.commands.updateAttributes('customImage', { src: url });
        } catch (error) {
          console.error('Image replacement failed:', error);
          toast.error('이미지 교체에 실패했습니다.');
        } finally {
          setUploading(false);
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('replaceImage', handleReplaceImage as EventListener);

    return () => {
      editorElement.removeEventListener('replaceImage', handleReplaceImage as EventListener);
    };
  }, [editor]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      setUploading(true);
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error('이미지 업로드에 실패했습니다.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  // 현재 폰트 패밀리 가져오기
  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || '기본';
  
  return (
    <div className="relative min-h-[800px] w-full max-w-[850px] mx-auto editor-container">
      {/* 1. 플로팅 메뉴 (빈 줄에서 나타남) */}
      {editor && (
        <FloatingMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-2xl p-2 gap-1 animate-in fade-in zoom-in-95 duration-200 min-w-[180px]"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">Quick Add</p>
          <button
            onClick={() => editor.chain().focus().run()} // Placeholder for logic
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs">블록 추가</p>
              <p className="text-[10px] text-gray-400">메뉴를 열어 다양한 요소를 추가하세요</p>
            </div>
          </button>
          
          <div className="h-px bg-gray-100 my-1 mx-2" />

          <button
            onClick={() => {
              const url = window.prompt('이미지 URL을 입력하거나 측면 바를 이용해 업로드하세요:');
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <span className="font-medium">이미지 삽입</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Type className="w-4 h-4 text-green-500" />
            <span className="font-medium">큰 제목 추가</span>
          </button>
        </FloatingMenu>
      )}

      {/* 2. 버블 메뉴 (텍스트 선택 시) */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100, maxWidth: 600 }}
          className="flex items-center gap-0.5 p-1.5 bg-gray-900 text-white rounded-lg shadow-xl overflow-visible"
        >
          {/* 단락 타입 선택 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium hover:bg-gray-800 rounded transition-colors min-w-[60px]">
                <span>단락</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-700 text-white min-w-[120px]">
              <DropdownMenuItem 
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={`hover:bg-gray-800 cursor-pointer ${editor.isActive('paragraph') ? 'bg-gray-700' : ''}`}
              >
                본문
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`hover:bg-gray-800 cursor-pointer ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-700' : ''}`}
              >
                제목 1
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`hover:bg-gray-800 cursor-pointer ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-700' : ''}`}
              >
                제목 2
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`hover:bg-gray-800 cursor-pointer ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-700' : ''}`}
              >
                제목 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* 폰트 선택 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-800 rounded transition-colors min-w-[80px]">
                <span className="truncate max-w-[60px]">{currentFontFamily}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-700 text-white max-h-[200px] overflow-y-auto">
              {fontFamilies.map((font) => (
                <DropdownMenuItem 
                  key={font.value}
                  onClick={() => font.value ? editor.chain().focus().setFontFamily(font.value).run() : editor.chain().focus().unsetFontFamily().run()}
                  className="hover:bg-gray-800 cursor-pointer"
                  style={{ fontFamily: font.value || 'inherit' }}
                >
                  {font.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* 텍스트 스타일 버튼들 */}
          <div className="flex items-center">
            {/* 색상 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-8 h-8 hover:bg-gray-800 rounded transition-colors">
                  <Palette className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-700 p-2">
                <div className="grid grid-cols-5 gap-1">
                  {textColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => editor.chain().focus().setColor(color.value).run()}
                      className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`h-8 w-8 text-white hover:bg-gray-800 ${editor.isActive('bold') ? 'bg-gray-700' : ''}`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`h-8 w-8 text-white hover:bg-gray-800 ${editor.isActive('italic') ? 'bg-gray-700' : ''}`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`h-8 w-8 text-white hover:bg-gray-800 ${editor.isActive('underline') ? 'bg-gray-700' : ''}`}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* 정렬 버튼들 */}
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`h-8 w-8 text-white hover:bg-gray-800 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-700' : ''}`}
              title="왼쪽 정렬"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`h-8 w-8 text-white hover:bg-gray-800 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-700' : ''}`}
              title="가운데 정렬"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`h-8 w-8 text-white hover:bg-gray-800 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-700' : ''}`}
              title="오른쪽 정렬"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* 링크 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Link URL:');
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            className={`h-8 w-8 text-white hover:bg-gray-800 ${editor.isActive('link') ? 'bg-gray-700' : ''}`}
            title="Link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* 삭제 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const { empty } = editor.state.selection;
              if (!empty) {
                editor.chain().focus().deleteSelection().run();
              } else {
                editor.chain().focus().deleteNode(editor.state.selection.$from.parent.type.name).run();
              }
            }}
            className="h-8 w-8 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <div 
        className="min-h-[800px] bg-white cursor-text" 
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
