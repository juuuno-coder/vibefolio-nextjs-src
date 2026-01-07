"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink, Calendar, MapPin, Award, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface PendingItem {
  id: number;
  title: string;
  description: string;
  type: "job" | "contest" | "event";
  date: string;
  location?: string | null;
  prize?: string | null;
  salary?: string | null;
  company?: string | null;
  employment_type?: string | null;
  link?: string | null;
  thumbnail?: string | null;
  is_active: boolean;
  created_at: string;
  crawled_at?: string | null;
}

export default function RecruitApprovalPage() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    loadPendingItems();
  }, []);

  const loadPendingItems = async () => {
    try {
      const { data, error } = await supabase
        .from('recruit_items')
        .select('*')
        .eq('is_approved', false)
        .order('crawled_at', { ascending: false });

      if (error) throw error;

      setPendingItems((data as any) || []);
    } catch (error) {
      console.error('Failed to load pending items:', error);
      toast.error('승인 대기 항목을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('recruit_items')
        .update({
          is_approved: true,
          is_active: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('승인되었습니다!');
      loadPendingItems();
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error('승인에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('정말 거부하시겠습니까? 이 항목은 삭제됩니다.')) return;

    setProcessing(id);
    try {
      const { error } = await supabase
        .from('recruit_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('거부되었습니다.');
      loadPendingItems();
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error('거부에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case "job":
        return { label: "채용", color: "bg-blue-100 text-blue-700" };
      case "contest":
        return { label: "공모전", color: "bg-purple-100 text-purple-700" };
      case "event":
        return { label: "이벤트", color: "bg-green-100 text-green-700" };
      default:
        return { label: "기타", color: "bg-gray-100 text-gray-700" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            크롤링 항목 승인
          </h1>
          <p className="text-gray-600">
            자동 크롤링된 항목을 검토하고 승인하세요.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              대기 중: {pendingItems.length}개
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPendingItems}
            >
              새로고침
            </Button>
          </div>
        </div>

        {/* 항목 목록 */}
        {pendingItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">승인 대기 중인 항목이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingItems.map((item) => {
              const typeInfo = getTypeInfo(item.type);
              
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                          {item.employment_type && (
                            <Badge variant="outline">{item.employment_type}</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        {item.company && (
                          <p className="text-sm text-gray-600 mt-1">{item.company}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {item.description}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{new Date(item.date).toLocaleDateString("ko-KR")}</span>
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-400" />
                          <span>{item.location}</span>
                        </div>
                      )}
                      {item.salary && (
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-gray-400" />
                          <span>{item.salary}</span>
                        </div>
                      )}
                      {item.prize && (
                        <div className="flex items-center gap-2">
                          <Award size={16} className="text-gray-400" />
                          <span>{item.prize}</span>
                        </div>
                      )}
                    </div>

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4"
                      >
                        <ExternalLink size={14} />
                        원본 링크 확인
                      </a>
                    )}

                    <div className="text-xs text-gray-400 mb-4">
                      크롤링 시간: {item.crawled_at ? new Date(item.crawled_at).toLocaleString("ko-KR") : '알 수 없음'}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(item.id)}
                        disabled={processing === item.id}
                      >
                        <Check size={16} className="mr-1" />
                        승인
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(item.id)}
                        disabled={processing === item.id}
                      >
                        <X size={16} className="mr-1" />
                        거부
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
