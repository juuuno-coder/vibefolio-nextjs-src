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

  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  const loadCollections = async () => {
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
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      console.log('컬렉션 생성 시도:', newCollectionName);

      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: newCollectionName,
          description: ''
        })
      });

      const data = await res.json();
      console.log('API 응답:', res.status, data);

      if (res.ok) {
        setCollections(prev => [data.collection, ...prev]);
        setNewCollectionName('');
        setShowNewForm(false);
        alert('컬렉션이 생성되었습니다!');
        // 새로 만든 컬렉션에 바로 추가
        await addToCollection(data.collection.collection_id);
      } else {
        alert(data.error || '컬렉션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('컬렉션 생성 실패:', error);
      alert('컬렉션 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addToCollection = async (collectionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
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
        alert('컬렉션에 추가되었습니다!');
        onOpenChange(false);
      } else {
        console.error('추가 실패:', data);
        alert(data.error || '추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('컬렉션 추가 실패:', error);
      alert('추가에 실패했습니다.');
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
            {collections.length > 0 ? (
              collections.map((collection) => (
                <button
                  key={collection.collection_id}
                  onClick={() => addToCollection(collection.collection_id)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Folder size={18} className="text-gray-600" />
                  <span className="flex-1 font-medium">{collection.name}</span>
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                컬렉션이 없습니다.<br />
                새 컬렉션을 만들어보세요!
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
