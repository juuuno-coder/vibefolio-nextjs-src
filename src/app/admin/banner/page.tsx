"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, StarOff, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface RecruitItem {
  id: number;
  title: string;
  description: string;
  type: "job" | "contest" | "event";
  company?: string;
  show_as_banner: boolean;
  banner_location?: "discover" | "recruit" | "both";
  banner_priority: number;
  is_approved: boolean;
  is_active: boolean;
}

export default function BannerManagementPage() {
  const [items, setItems] = useState<RecruitItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('recruit_items')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('banner_priority', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Failed to load items:', error);
      toast.error('항목을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBanner = async (id: number, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('recruit_items')
        .update({
          show_as_banner: !currentStatus,
          banner_approved_at: !currentStatus ? new Date().toISOString() : null,
          banner_approved_by: !currentStatus ? user?.id : null,
          banner_location: !currentStatus ? 'both' : null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(currentStatus ? '배너에서 제거되었습니다' : '배너로 설정되었습니다');
      loadItems();
    } catch (error) {
      console.error('Toggle banner failed:', error);
      toast.error('배너 설정에 실패했습니다');
    }
  };

  const updateBannerLocation = async (id: number, location: "discover" | "recruit" | "both") => {
    try {
      const { error } = await supabase
        .from('recruit_items')
        .update({ banner_location: location })
        .eq('id', id);

      if (error) throw error;

      toast.success('배너 위치가 변경되었습니다');
      loadItems();
    } catch (error) {
      console.error('Update location failed:', error);
      toast.error('위치 변경에 실패했습니다');
    }
  };

  const updatePriority = async (id: number, direction: 'up' | 'down') => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newPriority = direction === 'up' ? item.banner_priority - 1 : item.banner_priority + 1;

    try {
      const { error } = await supabase
        .from('recruit_items')
        .update({ banner_priority: newPriority })
        .eq('id', id);

      if (error) throw error;

      toast.success('우선순위가 변경되었습니다');
      loadItems();
    } catch (error) {
      console.error('Update priority failed:', error);
      toast.error('우선순위 변경에 실패했습니다');
    }
  };

  const bannerItems = items.filter(item => item.show_as_banner);
  const availableItems = items.filter(item => !item.show_as_banner);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            배너 관리
          </h1>
          <p className="text-gray-600">
            메인 페이지에 표시할 배너를 관리하세요
          </p>
        </div>

        {/* 현재 배너 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            현재 배너 ({bannerItems.length}개)
          </h2>
          {bannerItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">배너로 설정된 항목이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bannerItems.map((item) => (
                <Card key={item.id} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-600">배너</Badge>
                          <Badge variant="outline">{item.type === 'job' ? '채용' : item.type === 'contest' ? '공모전' : '이벤트'}</Badge>
                          {item.banner_location && (
                            <Badge variant="secondary">
                              {item.banner_location === 'discover' ? '둘러보기' : item.banner_location === 'recruit' ? '연결하기' : '둘 다'}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        {item.company && (
                          <p className="text-sm text-gray-600 mt-1">{item.company}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePriority(item.id, 'up')}
                          disabled={item.banner_priority <= 1}
                        >
                          <ArrowUp size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updatePriority(item.id, 'down')}
                        >
                          <ArrowDown size={16} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => toggleBanner(item.id, true)}
                        >
                          <StarOff size={16} className="mr-1" />
                          제거
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                    <div className="flex gap-2">
                      <Button
                        variant={item.banner_location === 'discover' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateBannerLocation(item.id, 'discover')}
                      >
                        둘러보기
                      </Button>
                      <Button
                        variant={item.banner_location === 'recruit' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateBannerLocation(item.id, 'recruit')}
                      >
                        연결하기
                      </Button>
                      <Button
                        variant={item.banner_location === 'both' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateBannerLocation(item.id, 'both')}
                      >
                        둘 다
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 사용 가능한 항목 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            배너로 추가 가능한 항목 ({availableItems.length}개)
          </h2>
          {availableItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">추가 가능한 항목이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2">
                          {item.type === 'job' ? '채용' : item.type === 'contest' ? '공모전' : '이벤트'}
                        </Badge>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        {item.company && (
                          <p className="text-sm text-gray-600 mt-1">{item.company}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                      onClick={() => toggleBanner(item.id, false)}
                    >
                      <Star size={16} className="mr-1" />
                      배너로 추가
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
