"use client";

import { 
  Type, 
  Image as ImageIcon, 
  Grid, 
  Video, 
  Settings, 
  Palette, 
  Paperclip, 
  Code,
  Box,
  MonitorPlay
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorSidebarProps {
  onAddText: () => void;
  onAddImage: () => void;
  onAddVideo: () => void;
  onAddGrid?: () => void;
  onAddCode?: () => void;
}

export function EditorSidebar({ 
  onAddText, 
  onAddImage, 
  onAddVideo,
  onAddGrid,
  onAddCode
}: EditorSidebarProps) {
  
  const contentButtons = [
    { label: "이미지", icon: ImageIcon, onClick: onAddImage },
    { label: "텍스트", icon: Type, onClick: onAddText },
    { label: "포토 그리드", icon: Grid, onClick: onAddGrid || (() => alert('준비 중입니다')) },
    { label: "비디오/오디오", icon: Video, onClick: onAddVideo },
    { label: "임베드", icon: Code, onClick: onAddCode || (() => window.prompt('Embed Code:')) },
    { label: "Lightroom", icon: MonitorPlay, onClick: () => alert('Lightroom 연동은 준비 중입니다'), disabled: true },
    { label: "프로토타입", icon: Box, onClick: () => alert('준비 중입니다'), disabled: true },
    { label: "3D", icon: Box, onClick: () => alert('3D 뷰어는 준비 중입니다'), disabled: true },
  ];

  return (
    <div className="w-[300px] flex-shrink-0 flex flex-col gap-6 pl-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
      
      {/* 콘텐츠 추가 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-500 mb-4 ml-1">콘텐츠 추가</h3>
        <div className="grid grid-cols-2 gap-3">
          {contentButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              disabled={btn.disabled}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-transparent transition-all
                ${btn.disabled 
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                  : 'bg-gray-50 text-gray-700 hover:bg-white hover:border-green-500 hover:shadow-md hover:text-green-600'
                }
              `}
            >
              <btn.icon className={`w-6 h-6 ${btn.disabled ? 'text-gray-300' : 'text-gray-900'}`} />
              <span className="text-xs font-medium">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 프로젝트 편집 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-500 mb-4 ml-1">프로젝트 편집</h3>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 py-6 flex-col gap-2 h-auto hover:border-green-500 hover:text-green-600">
            <Palette className="w-5 h-5" />
            <span className="text-xs">스타일</span>
          </Button>
          <Button variant="outline" className="flex-1 py-6 flex-col gap-2 h-auto hover:border-green-500 hover:text-green-600">
            <Settings className="w-5 h-5" />
            <span className="text-xs">설정</span>
          </Button>
        </div>
      </div>

      {/* 에셋 첨부 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
           <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
           에셋 첨부
        </h3>
        <Button variant="outline" className="w-full py-6 flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600">
          <Paperclip className="w-4 h-4" />
          <span>에셋 첨부</span>
        </Button>
        <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
          글꼴, 일러스트레이션, 사진, 압축 파일 또는 템플릿과 같은 파일을 무료 또는 유료 다운로드로 추가하세요.
        </p>
      </div>

      <div className="mt-auto">
         {/* Spacer to allow scrolling if tall */}
      </div>

    </div>
  );
}
