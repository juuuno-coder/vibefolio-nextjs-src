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
  MonitorPlay,
  Figma,
  Cuboid
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorSidebarProps {
  onAddText: () => void;
  onAddImage: () => void;
  onAddVideo: () => void;
  onAddGrid?: () => void;
  onAddCode?: () => void;
  onAddEmbed?: () => void;
  onAddLightroom?: () => void;
  onAddPrototype?: () => void;
  onAdd3D?: () => void;
  onStyleClick?: () => void;
  onSettingsClick?: () => void;
  onAddAsset?: () => void;
  isGrowthMode?: boolean;
}

export function EditorSidebar({ 
  onAddText, 
  onAddImage, 
  onAddVideo,
  onAddGrid,
  onAddCode,
  onAddEmbed,
  onAddLightroom,
  onAddPrototype,
  onAdd3D,
  onStyleClick,
  onSettingsClick,
  onAddAsset,
  isGrowthMode = false,
}: EditorSidebarProps) {
  
  const contentButtons = [
    { label: "이미지", icon: ImageIcon, onClick: onAddImage, color: "hover:border-blue-500 hover:text-blue-600" },
    { label: "텍스트", icon: Type, onClick: onAddText, color: "hover:border-green-500 hover:text-green-600" },
    { label: "포토 그리드", icon: Grid, onClick: onAddGrid || (() => alert('여러 이미지를 선택하세요')), color: "hover:border-purple-500 hover:text-purple-600" },
    { label: "비디오/오디오", icon: Video, onClick: onAddVideo, color: "hover:border-red-500 hover:text-red-600" },
    { label: "임베드", icon: Code, onClick: onAddEmbed || onAddCode || (() => {
       const code = window.prompt('임베드 코드를 입력하세요 (iframe, script 등):');
       if (code) alert('임베드 코드가 추가되었습니다. (구현 예정)');
    }), color: "hover:border-orange-500 hover:text-orange-600" },
    { label: "Lightroom", icon: MonitorPlay, onClick: onAddLightroom || (() => {
       const albumUrl = window.prompt('Adobe Lightroom 앨범 URL을 입력하세요:');
       if (albumUrl) alert(`Lightroom 앨범 연동 예정: ${albumUrl}`);
    }), color: "hover:border-cyan-500 hover:text-cyan-600" },
    { label: "프로토타입", icon: Figma, onClick: onAddPrototype || (() => {
       const figmaUrl = window.prompt('Figma 또는 프로토타입 URL을 입력하세요:');
       if (figmaUrl) alert(`프로토타입 연동 예정: ${figmaUrl}`);
    }), color: "hover:border-pink-500 hover:text-pink-600" },
    { label: "3D", icon: Cuboid, onClick: onAdd3D || (() => {
       const modelUrl = window.prompt('3D 모델 URL을 입력하세요 (Sketchfab 등):');
       if (modelUrl) alert(`3D 모델 연동 예정: ${modelUrl}`);
    }), color: "hover:border-amber-500 hover:text-amber-600" },
  ];

  return (
    <div className="w-[300px] flex-shrink-0 flex flex-col gap-6 pl-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* 콘텐츠 추가 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-500 mb-4 ml-1">콘텐츠 추가</h3>
        <div className="grid grid-cols-2 gap-3">
          {contentButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-transparent transition-all
                bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md ${btn.color}
              `}
            >
              <btn.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 프로젝트 편집 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-500 mb-4 ml-1">프로젝트 편집</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 py-6 flex-col gap-2 h-auto hover:border-green-500 hover:text-green-600"
            onClick={onStyleClick || (() => alert('스타일 설정 기능 준비 중'))}
          >
            <Palette className="w-5 h-5" />
            <span className="text-xs">스타일</span>
          </Button>
          {!isGrowthMode && (
            <Button 
              variant="outline" 
              className="flex-1 py-6 flex-col gap-2 h-auto hover:border-green-500 hover:text-green-600"
              onClick={onSettingsClick || (() => alert('설정 기능 준비 중'))}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">설정</span>
            </Button>
          )}
        </div>
      </div>

      {/* 에셋 첨부 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
           <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
           에셋 첨부
        </h3>
        <Button 
          variant="outline" 
          className="w-full py-6 flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
          onClick={onAddAsset || (() => alert('에셋 첨부 기능 준비 중'))}
        >
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
