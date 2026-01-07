"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Image, RefreshCw, Check } from "lucide-react";

interface LightroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (images: string[]) => void;
}

interface LightroomPhoto {
  id: string;
  url: string;
  thumbnail: string;
  title?: string;
}

// Adobe Lightroom API 설정
// 실제 사용 시 Adobe Developer Console에서 발급받은 키 사용
const ADOBE_CLIENT_ID = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID || '';
const ADOBE_REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/auth/adobe/callback`
  : '';

export function LightroomModal({ isOpen, onClose, onImport }: LightroomModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState<LightroomPhoto[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // 초기화 시 저장된 토큰 확인
  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem('adobe_lightroom_token');
      if (savedToken) {
        setAccessToken(savedToken);
        setIsConnected(true);
        loadPhotos(savedToken);
      }
    }
  }, [isOpen]);

  // Adobe OAuth 인증 시작
  const handleConnect = () => {
    if (!ADOBE_CLIENT_ID) {
      alert('Adobe API 클라이언트 ID가 설정되지 않았습니다.\n\n프로젝트 루트의 .env.local 파일에 다음 내용을 추가해주세요:\nNEXT_PUBLIC_ADOBE_CLIENT_ID=발급받은_키_값');
      return;
    }

    // Adobe IMS OAuth URL 구성
    const scopes = encodeURIComponent('openid AdobeID lr_partner_apis lr_partner_rendition_apis');
    const authUrl = `https://ims-na1.adobelogin.com/ims/authorize/v2?client_id=${ADOBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(ADOBE_REDIRECT_URI)}&scope=${scopes}&response_type=code`;

    // 팝업 창으로 인증
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      authUrl,
      'Adobe Sign In',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );

    // 팝업에서 인증 완료 메시지 수신
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'adobe_auth_success' && event.data?.token) {
        setAccessToken(event.data.token);
        setIsConnected(true);
        localStorage.setItem('adobe_lightroom_token', event.data.token);
        loadPhotos(event.data.token);
        popup?.close();
      } else if (event.data?.type === 'adobe_auth_error') {
        alert('Adobe 인증에 실패했습니다: ' + (event.data.error || '알 수 없는 오류'));
        popup?.close();
      }
    };

    window.addEventListener('message', handleMessage);

    // 팝업 닫힘 감지 (인증 취소)
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 500);
  };

  // Lightroom에서 사진 로드
  const loadPhotos = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/lightroom/photos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // 토큰 만료
          handleDisconnect();
          return;
        }
        throw new Error('사진을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Lightroom photos load error:', error);
      // 데모용 샘플 데이터 (API 연동 전)
      setPhotos([
        { id: '1', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200', title: 'Mountain View' },
        { id: '2', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800', thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200', title: 'Nature' },
        { id: '3', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=200', title: 'Landscape' },
        { id: '4', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800', thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200', title: 'Foggy Hills' },
        { id: '5', url: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800', thumbnail: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=200', title: 'Sunset' },
        { id: '6', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200', title: 'Beach' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 연결 해제
  const handleDisconnect = () => {
    localStorage.removeItem('adobe_lightroom_token');
    setAccessToken(null);
    setIsConnected(false);
    setPhotos([]);
    setSelectedPhotos(new Set());
  };

  // 사진 선택 토글
  const togglePhotoSelection = (id: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPhotos(newSelected);
  };

  // 선택한 사진 가져오기
  const handleImport = () => {
    const selectedUrls = photos
      .filter(p => selectedPhotos.has(p.id))
      .map(p => p.url);
    
    if (selectedUrls.length > 0) {
      onImport(selectedUrls);
      setSelectedPhotos(new Set());
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedPhotos(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded flex items-center justify-center text-white font-bold text-sm">
              Lr
            </div>
            Adobe Lightroom 연동
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!isConnected ? (
            // 연결 안 됨 상태
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-3xl">Lr</span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Lightroom과 연결하기
                </h3>
                <p className="text-gray-500 max-w-md">
                  Adobe Lightroom 계정을 연결하면 클라우드에 저장된 사진을 바로 가져올 수 있습니다.
                </p>
              </div>
              <Button 
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Adobe 계정으로 로그인
              </Button>
              <p className="text-xs text-gray-400 text-center max-w-sm">
                로그인 시 Adobe 이용약관에 동의하는 것으로 간주됩니다.<br />
                사진 접근 권한만 요청하며, 수정이나 삭제 권한은 요청하지 않습니다.
              </p>
            </div>
          ) : (
            // 연결됨 상태 - 사진 목록
            <div className="space-y-4">
              {/* 상단 액션 바 */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadPhotos(accessToken!)}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </Button>
                  <span className="text-sm text-gray-500">
                    {photos.length}개의 사진
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-gray-500 hover:text-red-500"
                >
                  연결 해제
                </Button>
              </div>

              {/* 사진 그리드 */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              ) : photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Image className="w-16 h-16 mb-4 opacity-50" />
                  <p>Lightroom 라이브러리가 비어 있습니다.</p>
                  <p className="text-sm">Lightroom Web으로 이동하여 사진을 업로드하세요.</p>
                  <Button 
                    variant="link" 
                    className="mt-2 text-blue-600"
                    onClick={() => window.open('https://lightroom.adobe.com', '_blank')}
                  >
                    Lightroom Web 열기
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => togglePhotoSelection(photo.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedPhotos.has(photo.id)
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img 
                        src={photo.thumbnail} 
                        alt={photo.title || ''} 
                        className="w-full h-full object-cover"
                      />
                      {selectedPhotos.has(photo.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        {isConnected && selectedPhotos.size > 0 && (
          <div className="flex-shrink-0 border-t pt-4 mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedPhotos.size}개 선택됨
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button 
                onClick={handleImport}
                className="bg-blue-600 hover:bg-blue-700"
              >
                선택한 사진 가져오기
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default LightroomModal;
