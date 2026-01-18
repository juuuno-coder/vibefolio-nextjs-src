"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Key, Copy, Trash2, Plus, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ApiKey {
  key_id: number;
  key_name: string | null;
  key_prefix: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('API 키 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      // Generate API key using DB function
      const { data: keyData, error: keyError } = await supabase
        .rpc('generate_api_key');

      if (keyError) throw keyError;

      const apiKey = keyData as string;
      const keyPrefix = apiKey.substring(0, 7) + '...';

      // Insert into database
      const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          api_key: apiKey,
          key_name: newKeyName || 'Unnamed Key',
          key_prefix: keyPrefix,
          is_active: true
        });

      if (insertError) throw insertError;

      setGeneratedKey(apiKey);
      setNewKeyName("");
      fetchApiKeys();
      toast.success('API 키가 생성되었습니다!');
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('API 키 생성에 실패했습니다.');
    }
  };

  const deleteApiKey = async (keyId: number) => {
    if (!confirm('정말로 이 API 키를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('key_id', keyId);

      if (error) throw error;

      fetchApiKeys();
      toast.success('API 키가 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('API 키 삭제에 실패했습니다.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('클립보드에 복사되었습니다!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" />
            API Keys
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            외부 도구에서 프로젝트를 자동 등록하기 위한 API 키를 관리합니다.
          </p>
        </div>
        <Button 
          onClick={() => setCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          <Plus className="w-4 h-4" />
          새 API 키 생성
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      ) : apiKeys.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">생성된 API 키가 없습니다.</p>
          <Button onClick={() => setCreateModalOpen(true)} variant="outline">
            첫 API 키 만들기
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <Card key={key.key_id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{key.key_name || 'Unnamed Key'}</h4>
                    {key.is_active ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">활성</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">비활성</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-mono">{key.key_prefix}</span>
                    <span>생성: {new Date(key.created_at).toLocaleDateString('ko-KR')}</span>
                    {key.last_used_at && (
                      <span>마지막 사용: {new Date(key.last_used_at).toLocaleDateString('ko-KR')}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteApiKey(key.key_id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create API Key Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 API 키 생성</DialogTitle>
            <DialogDescription>
              API 키는 한 번만 표시되므로 안전한 곳에 보관하세요.
            </DialogDescription>
          </DialogHeader>

          {!generatedKey ? (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  키 이름 (선택사항)
                </label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="예: My Dev Machine"
                  className="w-full"
                />
              </div>
              <Button onClick={generateApiKey} className="w-full bg-indigo-600 hover:bg-indigo-700">
                생성하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>중요:</strong> 이 키는 다시 표시되지 않습니다. 지금 복사해서 안전한 곳에 보관하세요.
                </div>
              </div>

              <div className="relative">
                <Input
                  value={generatedKey}
                  readOnly
                  type={showKey ? "text" : "password"}
                  className="font-mono text-sm pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowKey(!showKey)}
                    className="h-7 w-7 p-0"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedKey)}
                    className="h-7 w-7 p-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button 
                onClick={() => {
                  setGeneratedKey(null);
                  setCreateModalOpen(false);
                }}
                className="w-full"
                variant="outline"
              >
                완료
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
