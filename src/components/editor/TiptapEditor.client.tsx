"use client";

import { useEditor, EditorContent, BubbleMenu, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import YoutubeExtension from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import FloatingMenuExtension from '@tiptap/extension-floating-menu';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Heading2,
  Link as LinkIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadImage } from '@/lib/supabase/storage';

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
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto my-4',
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
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-8 py-6',
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

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      setUploading(true);
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error('Image upload failed:', error);
        alert('이미지 업로드에 실패했습니다.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative min-h-[600px] w-full max-w-[850px] mx-auto">
      {/* Bubble Menu */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 p-2 bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden"
        >
          <div className="flex items-center gap-1 border-r border-gray-700 pr-2 mr-2">
             <span className="text-xs font-semibold px-2 uppercase tracking-wider text-gray-400">Text</span>
          </div>
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
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`h-8 w-8 text-white hover:bg-gray-800 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-700' : ''}`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-gray-700 mx-1"></div>
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
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <div 
        className="min-h-[800px] bg-white cursor-text" 
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Hidden file input for sidebar usage (exposed via handling on parent or ref? 
          Actually parent will have its own input or trigger this one?
          Wait, parent triggers handleFileUpload?
          TiptapEditor logic encapsulated handleFileUpload.
          If Sidebar is outside, Sidebar needs to trigger `uploadImage`.
          The parent (page.tsx) will handle Sidebar clicks and call editor commands.
          So Page.tsx needs its own file upload logic OR access to this one.
          I'll let Page.tsx handle file upload for the sidebar button.
          This input here is legacy or for bubble menu if needed (removed from toolbar).
          I'll keep it just in case I add image button back to bubble menu.
      */}
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
