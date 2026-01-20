"use client";

import { useEditor, EditorContent, BubbleMenu, FloatingMenu, Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { CustomImageExtension } from './CustomImageExtension';
import { IframeExtension } from './IframeExtension';
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
  List,
  ListOrdered
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
          class: 'rounded-xl my-4',
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
      IframeExtension,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-8 py-6 editor-blocks',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
          
          if (files.length > 0) {
            event.preventDefault();
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            const pos = coordinates ? coordinates.pos : view.state.selection.from;
            
            setUploading(true);
            
            // Upload all images in parallel
            Promise.all(files.map(file => uploadImage(file, 'projects')))
              .then((urls) => {
                 if (urls.length > 0) {
                   const nodes = urls.map(url => view.state.schema.nodes.image.create({ src: url }));
                   // Insert images at the drop position
                   const tr = view.state.tr;
                   // Insert one by one or as a fragment? Fragment is better but let's do safe logic
                   // We insert in reverse order if we insert at same pos, but inserting at pos + offset is hard.
                   // Let's insert all at 'pos' position, they will push each other.
                   // To keep order [1,2,3], insert 3, then 2, then 1? No, Tiptap inserts at pos.
                   
                   // Best approach: Insert structured fragment
                   // view.dispatch(tr.insert(pos, nodes));
                   // Note: 'insert' accepts a node or array of nodes (fragment)
                   view.dispatch(tr.insert(pos, nodes));
                 }
              })
              .catch((error) => {
                console.error('Drop upload failed:', error);
                toast.error(`${files.length}개 이미지 업로드 중 오류가 발생했습니다.`);
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
    const files = e.target.files;
    if (files && files.length > 0 && editor) {
      setUploading(true);
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

      try {
        const urls = await Promise.all(imageFiles.map(file => uploadImage(file)));
        if (urls.length > 0) {
            editor.chain().focus().run();
            // Insert all images at once using HTML
            const html = urls.map(url => `<img src="${url}" />`).join('<p></p>');
            editor.chain().focus().insertContent(html).run();
        }
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
      {/* 0. Top Fixed Toolbar (Added for UX improvement) */}
      <EditorToolbar editor={editor} />
      
      {/* 1. 플로팅 메뉴 (빈 줄에서 나타남) */}


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
        multiple
        className="hidden"
      />
    </div>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  
  return (
    <div className="sticky top-4 z-40 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl px-3 py-2 flex flex-wrap gap-1.5 items-center mb-8 shadow-sm transition-all w-full max-w-[850px]">
      
      {/* Headings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg">
            <Type size={16} />
            <span className="text-xs">스타일</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white border-slate-200 min-w-[140px] p-1 shadow-lg rounded-xl">
          <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()} className="cursor-pointer rounded-lg text-sm font-medium p-2 hover:bg-slate-50">본문</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="cursor-pointer rounded-lg text-lg font-black p-2 hover:bg-slate-50">제목 1</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="cursor-pointer rounded-lg text-base font-bold p-2 hover:bg-slate-50">제목 2</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="cursor-pointer rounded-lg text-sm font-bold p-2 hover:bg-slate-50">제목 3</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-5 bg-slate-200 mx-1" />

       {/* Alignment */}
      <div className="flex bg-slate-100 rounded-lg p-0.5">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`h-7 w-7 p-0 rounded-md transition-all ${editor.isActive({ textAlign: 'left' }) ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`h-7 w-7 p-0 rounded-md transition-all ${editor.isActive({ textAlign: 'center' }) ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`h-7 w-7 p-0 rounded-md transition-all ${editor.isActive({ textAlign: 'right' }) ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <AlignRight className="w-4 h-4" />
          </Button>
      </div>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Bold/Italic/Underline */}
      <div className="flex bg-slate-100 rounded-lg p-0.5">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={`h-7 w-7 p-0 rounded-md transition-all ${editor.isActive('bold') ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={`h-7 w-7 p-0 rounded-md transition-all ${editor.isActive('italic') ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`h-7 w-7 p-0 rounded-md transition-all ${editor.isActive('underline') ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <UnderlineIcon className="w-4 h-4" />
          </Button>
      </div>

       <div className="w-px h-5 bg-slate-200 mx-1" />

       {/* Lists */}
       <div className="flex bg-slate-100 rounded-lg p-0.5">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`h-7 w-7 p-0 rounded-md transition-all ${editor.isActive('bulletList') ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`h-7 w-7 p-0 rounded-md transition-all ${editor.isActive('orderedList') ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <ListOrdered className="w-4 h-4" />
          </Button>
      </div>
      
      <div className="flex-1" />
      
      <p className="text-[10px] text-slate-400 font-medium px-2">
        {editor.storage.characterCount?.characters() || 0}자
      </p>

    </div>
  );
}
