// src/components/CollectionModal.tsx
"use client";

import React, { useState } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch collections
  const { data: collections = [], isLoading: loadingCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('Collection')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Collection[];
    },
    enabled: open, // Fetch when modal opens
  });

  // Create collection mutation
  const { mutate: createCollection, isPending: creating } = useMutation({
    mutationFn: async (name: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Use 'as any' safely here because type definitions for Insert might be strict about nullable fields
        // or just ensure strict type conformity.
        const { data, error } = await supabase
            .from('Collection')
            .insert({
                user_id: user.id,
                name: name,
                description: null
            } as any)
            .select()
            .single();

        if (error) throw error;
        // Cast data to Collection to help typescript inference if it failed
        return data as unknown as Collection;
    },
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['collections'] });
        setNewCollectionName('');
        setShowNewForm(false);
        toast.success(`'${data.name}' 컬렉션이 생성되었습니다.`);
        setSelectedCollectionId(data.collection_id);
    },
    onError: (error) => {
        console.error(error);
        toast.error("컬렉션 생성에 실패했습니다.");
    }
  });

  // Add to collection mutation
  const { mutate: addToCollection } = useMutation({
    mutationFn: async (collectionId: string) => {
        // Check if already added
        const { data: existing } = await supabase
            .from('CollectionItem')
            .select('*')
            .eq('collection_id', collectionId)
            .eq('project_id', parseInt(projectId))
            .maybeSingle(); // Use maybeSingle to avoid error if not found

        if (existing) {
            // Already added - throw special error or return status
            throw new Error("ALREADY_EXISTS");
        }

        const { error } = await supabase
            .from('CollectionItem')
            .insert({
                collection_id: collectionId,
                project_id: parseInt(projectId)
            } as any);

        if (error) throw error;
    },
    onSuccess: (_, collectionId) => {
        const collectionName = collections.find(c => c.collection_id === collectionId)?.name || '컬렉션';
        toast.success(`'${collectionName}'에 저장되었습니다!`);
        onOpenChange(false);
    },
    onError: (error, collectionId) => {
        if (error.message === "ALREADY_EXISTS") {
             const collectionName = collections.find(c => c.collection_id === collectionId)?.name || '이 컬렉션';
             toast.info(`이미 '${collectionName}'에 저장되어 있습니다.`);
        } else {
            console.error(error);
            toast.error("추가에 실패했습니다.");
        }
    }
  });

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
                onKeyPress={(e) => e.key === 'Enter' && createCollection(newCollectionName)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => createCollection(newCollectionName)}
                  disabled={creating || !newCollectionName.trim()}
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
                <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
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
                      ? 'bg-green-600 text-white border-green-600'
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
              className="w-full bg-green-600 hover:bg-green-700"
            >
              선택한 컬렉션에 저장
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
