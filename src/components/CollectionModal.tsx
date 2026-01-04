"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, Plus, Check } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Collection {
  collection_id: string;
  name: string;
  description: string;
}

interface CollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CollectionModal({
  open,
  onOpenChange,
  projectId,
}: CollectionModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadCollections();
      setSelectedCollectionId(null);
    }
  }, [open]);

  const loadCollections = async () => {
    setLoadingCollections(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/collections', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('컬렉션 로드 실패:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const createCollection = async () => {
    const trimmedName = newCollectionName.trim();
    
    if (!trimmedName) {
      toast.error('컬렉션 이름을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      console.log('컬렉션 생성 시도:', trimmedName);

      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: trimmedName,
          description: ''
        })
      });

      const data = await res.json();
      console.log('API 응답:', res.status, data);

      if (res.ok) {
        setCollections(prev => [data.collection, ...prev]);
        setNewCollectionName('');
        setShowNewForm(false);
        toast.success('컬렉션이 생성되었습니다!', {
          description: `'${trimmedName}' 컬렉션을 선택해주세요.`,
        });
        // 새로 만든 컬렉션 선택
        setSelectedCollectionId(data.collection.collection_id);
      } else {
        toast.error(data.error || '컬렉션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('컬렉션 생성 실패:', error);
      toast.error('컬렉션 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addToCollection = async (collectionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      console.log('컬렉션에 추가 시도:', { collectionId, projectId });

      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          projectId: parseInt(projectId) 
        })
      });

      const data = await res.json();
      console.log('추가 API 응답:', res.status, data);

      if (res.ok) {
        const collectionName = collections.find(c => c.collection_id === collectionId)?.name || '컬렉션';
        toast.success('컬렉션에 저장되었습니다!', {
          description: `'${collectionName}'에 추가되었습니다.`,
          icon: '📁',
        });
        onOpenChange(false);
      } else {
        console.error('추가 실패:', data);
        toast.error(data.error || '추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('컬렉션 추가 실패:', error);
      toast.error('추가에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>컬렉션에 저장</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 새 컬렉션 만들기 */}
          {showNewForm ? (
            <div className="space-y-2">
              <Input
                placeholder="컬렉션 이름"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createCollection()}
              />
              <div className="flex gap-2">
                <Button
                  onClick={createCollection}
                  disabled={loading || !newCollectionName.trim()}
                  className="flex-1"
                >
                  생성
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewForm(false);
                    setNewCollectionName('');
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowNewForm(true)}
            >
              <Plus size={16} className="mr-2" />
              새 컬렉션 만들기
            </Button>
          )}

          {/* 기존 컬렉션 목록 */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {loadingCollections ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-[#4ACAD4] border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">컬렉션을 불러오는 중...</p>
              </div>
            ) : collections.length > 0 ? (
              collections.map((collection) => (
                <button
                  key={collection.collection_id}
                  onClick={() => setSelectedCollectionId(collection.collection_id)}
                  onDoubleClick={() => addToCollection(collection.collection_id)}
                  className={`w-full p-3 text-left border rounded-lg transition-colors flex items-center gap-2 ${
                    selectedCollectionId === collection.collection_id
                      ? 'bg-[#4ACAD4] text-white border-[#4ACAD4]'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <Folder size={18} className={selectedCollectionId === collection.collection_id ? 'text-white' : 'text-gray-600'} />
                  <span className="flex-1 font-medium">{collection.name}</span>
                  {selectedCollectionId === collection.collection_id && (
                    <Check size={18} className="text-white" />
                  )}
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                컬렉션이 없습니다.<br />
                새 컬렉션을 만들어보세요!
              </p>
            )}
          </div>

          {/* 저장 버튼 */}
          {selectedCollectionId && (
            <Button
              onClick={() => addToCollection(selectedCollectionId)}
              className="w-full bg-[#4ACAD4] hover:bg-[#3db8c0]"
            >
              선택한 컬렉션에 저장
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
