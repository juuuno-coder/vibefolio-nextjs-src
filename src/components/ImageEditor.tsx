"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, ZoomIn, ZoomOut, Check, X } from "lucide-react";

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  aspectRatio?: number; // 예: 16/9, 1, 4/3
  onSave: (croppedImageBlob: Blob) => void;
}

// 중앙 기준 초기 크롭 영역 생성
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageEditor({
  isOpen,
  onClose,
  imageUrl,
  aspectRatio = 1,
  onSave,
}: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 이미지 로드 시 초기 크롭 설정
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    },
    [aspectRatio]
  );

  // 크롭된 이미지 생성
  const getCroppedImage = useCallback(async (): Promise<Blob | null> => {
    const image = imgRef.current;
    const canvas = canvasRef.current;
    
    if (!image || !canvas || !completedCrop) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelRatio = window.devicePixelRatio;

    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = "high";

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;

    const rotateRads = (rotate * Math.PI) / 180;
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.translate(centerX, centerY);
    ctx.rotate(rotateRads);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.9
      );
    });
  }, [completedCrop, rotate, scale]);

  // 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const blob = await getCroppedImage();
      if (blob) {
        onSave(blob);
        onClose();
      }
    } catch (error) {
      console.error("이미지 크롭 실패:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 리셋
  const handleReset = () => {
    setScale(1);
    setRotate(0);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>이미지 편집</DialogTitle>
        </DialogHeader>

        {/* 이미지 크롭 영역 */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg min-h-[300px]">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-h-[60vh]"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="편집할 이미지"
              onLoad={onImageLoad}
              style={{
                transform: `scale(${scale}) rotate(${rotate}deg)`,
                maxHeight: "60vh",
                objectFit: "contain",
              }}
            />
          </ReactCrop>
        </div>

        {/* 편집 컨트롤 */}
        <div className="space-y-4 py-4">
          {/* 확대/축소 */}
          <div className="flex items-center gap-4">
            <ZoomOut className="w-4 h-4 text-gray-500" />
            <Slider
              value={[scale]}
              onValueChange={(values: number[]) => setScale(values[0])}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500 w-12">{Math.round(scale * 100)}%</span>
          </div>

          {/* 회전 */}
          <div className="flex items-center gap-4">
            <RotateCcw className="w-4 h-4 text-gray-500" />
            <Slider
              value={[rotate]}
              onValueChange={(values: number[]) => setRotate(values[0])}
              min={-180}
              max={180}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-12">{rotate}°</span>
          </div>
        </div>

        {/* 버튼 */}
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Check className="w-4 h-4 mr-2" />
            {isSaving ? "저장 중..." : "적용"}
          </Button>
        </DialogFooter>

        {/* 숨겨진 캔버스 (크롭 결과물 생성용) */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

// 간단한 이미지 크롭 훅
export function useImageEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [onComplete, setOnComplete] = useState<((blob: Blob) => void) | null>(null);

  const openEditor = (url: string, callback: (blob: Blob) => void) => {
    setImageUrl(url);
    setOnComplete(() => callback);
    setIsOpen(true);
  };

  const closeEditor = () => {
    setIsOpen(false);
    setImageUrl("");
    setOnComplete(null);
  };

  const handleSave = (blob: Blob) => {
    if (onComplete) {
      onComplete(blob);
    }
    closeEditor();
  };

  return {
    isOpen,
    imageUrl,
    openEditor,
    closeEditor,
    handleSave,
  };
}
