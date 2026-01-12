"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Upload, Image as ImageIcon, Globe, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/storage";
import { useAdmin } from "@/hooks/useAdmin";
import { logActivity } from "@/lib/utils/logger";

interface SiteConfig {
  key: string;
  value: string;
  description?: string;
}

export default function AdminSettingsPage() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState<{
    seo_title: string;
    seo_description: string;
    seo_og_image: string;
    seo_favicon: string;
  }>({
    seo_title: "",
    seo_description: "",
    seo_og_image: "",
    seo_favicon: "",
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/");
      return;
    }

    if (isAdmin) {
      loadConfig();
    }
  }, [isAdmin, adminLoading, router]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('site_config')
        .select('*');

      if (error) throw error;

      if (data) {
        const newConfig = { ...config };
        data.forEach((item: SiteConfig) => {
          if (item.key in newConfig) {
            (newConfig as any)[item.key] = item.value;
          }
        });
        setConfig(newConfig);
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
      toast.error('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updates = Object.entries(config).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));

      const { error } = await (supabase as any)
        .from('site_config')
        .upsert(updates);

      if (error) throw error;

      await logActivity({
        action: 'UPDATE',
        targetType: 'SETTINGS',
        details: { items: Object.keys(config) },
        userId: (await supabase.auth.getUser()).data.user?.id || '',
        userEmail: (await supabase.auth.getUser()).data.user?.email
      });

      toast.success('설정이 저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
      toast.error('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("이미지 업로드 중...");
      // Using 'banners' bucket as it's public and appropriate for site-wide images
      const url = await uploadImage(file, 'banners');
      setConfig(prev => ({ ...prev, seo_og_image: url }));
      toast.success("이미지가 업로드되었습니다.");
    } catch (err) {
      toast.error("업로드 실패: " + (err as Error).message);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("파비콘 업로드 중...");
      const url = await uploadImage(file, 'banners');
      setConfig(prev => ({ ...prev, seo_favicon: url }));
      toast.success("파비콘이 업로드되었습니다.");
    } catch (err) {
      toast.error("업로드 실패: " + (err as Error).message);
    }
  };

  if (adminLoading || loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" /></div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Globe className="text-slate-400" size={32} />
            사이트 설정
          </h1>
          <p className="text-slate-500 mt-2 font-medium">SEO 및 사이트 전역 설정을 관리합니다.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-200"
        >
          {saving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" size={18} />}
          변경사항 저장
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* SEO Settings */}
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Search size={22} />
              </div>
              <CardTitle className="text-xl font-black text-slate-900">SEO 및 메타데이터</CardTitle>
            </div>
            <CardDescription className="text-slate-500 font-medium">
              검색 엔진(Google, Naver)과 소셜 미디어(Kakao, Facebook)에 표시될 사이트 정보를 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8 bg-white">
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title" className="text-sm font-bold text-slate-700">사이트 제목 (Title)</Label>
                <Input
                  id="seo_title"
                  placeholder="Vibefolio - 크리에이터를 위한 영감 저장소"
                  value={config.seo_title}
                  onChange={(e) => setConfig(prev => ({ ...prev, seo_title: e.target.value }))}
                  className="h-12 rounded-xl border-slate-200"
                />
                <p className="text-xs text-slate-400 font-medium ml-1">브라우저 탭과 검색 결과 제목에 표시됩니다.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description" className="text-sm font-bold text-slate-700">사이트 설명 (Description)</Label>
                <Textarea
                  id="seo_description"
                  placeholder="디자이너, 개발자, 기획자를 위한 프로젝트 아카이빙 및 레퍼런스 공유 플랫폼"
                  value={config.seo_description}
                  onChange={(e) => setConfig(prev => ({ ...prev, seo_description: e.target.value }))}
                  className="min-h-[100px] rounded-xl border-slate-200 resize-none p-4 leading-relaxed"
                />
                <p className="text-xs text-slate-400 font-medium ml-1">검색 결과 사이트 제목 아래에 표시되는 설명 문구입니다.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <Label className="text-sm font-bold text-slate-700 mb-4 block">오픈그래프(OpenGraph) 이미지</Label>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div className="relative group w-full aspect-[1.91/1] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    {config.seo_og_image ? (
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${config.seo_og_image})` }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <span className="text-xs font-bold">이미지가 설정되지 않았습니다</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button variant="secondary" className="font-bold" onClick={() => document.getElementById('og_image_upload')?.click()}>
                        이미지 변경
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    * 카카오톡, 페이스북, 트위터 공유 시 나타나는 이미지입니다.<br/>
                    * 권장 사이즈: <strong className="text-slate-600">1200 x 630 px</strong> (1.91:1 비율)
                  </p>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">이미지 URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={config.seo_og_image}
                        onChange={(e) => setConfig(prev => ({ ...prev, seo_og_image: e.target.value }))}
                        placeholder="https://..."
                        className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium"
                      />
                      <Button 
                        variant="outline" 
                        className="h-10 px-4 rounded-xl border-slate-200"
                        onClick={() => document.getElementById('og_image_upload')?.click()}
                      >
                        <Upload size={14} />
                      </Button>
                      <input 
                        type="file" 
                        id="og_image_upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                  
                  {/* Preview UI Mockup */}
                  <div className="bg-[#FAE100] p-4 rounded-xl text-black space-y-2 max-w-sm">
                    <div className="text-[10px] font-bold opacity-50">카카오톡 공유 미리보기</div>
                    <div className="bg-white rounded-lg overflow-hidden flex flex-col shadow-sm">
                       <div className="aspect-[1.91/1] bg-slate-100 bg-cover bg-center" style={{ backgroundImage: config.seo_og_image ? `url(${config.seo_og_image})` : 'none' }}>
                         {!config.seo_og_image && <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">No Image</div>}
                       </div>
                       <div className="p-3">
                          <div className="font-bold text-sm line-clamp-1">{config.seo_title || "Vibefolio"}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{config.seo_description || "설명이 없습니다."}</div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <Label className="text-sm font-bold text-slate-700 mb-4 block">파비콘 (Favicon)</Label>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-6">
                    <div className="relative group w-32 h-32 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                      {config.seo_favicon ? (
                        <div 
                          className="w-full h-full bg-contain bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${config.seo_favicon})` }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <ImageIcon size={24} className="mb-2 opacity-50" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button variant="secondary" size="sm" className="font-bold" onClick={() => document.getElementById('favicon_upload')?.click()}>
                          변경
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 py-2">
                       <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        * 브라우저 탭에 표시되는 작은 아이콘입니다.<br/>
                        * 권장 사이즈: <strong className="text-slate-600">192 x 192 px</strong> 이상<br/>
                        * 포맷: PNG, ICO 권장
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">아이콘 URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={config.seo_favicon || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, seo_favicon: e.target.value }))}
                        placeholder="https://..."
                        className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium"
                      />
                      <Button 
                        variant="outline" 
                        className="h-10 px-4 rounded-xl border-slate-200"
                        onClick={() => document.getElementById('favicon_upload')?.click()}
                      >
                        <Upload size={14} />
                      </Button>
                      <input 
                        type="file" 
                        id="favicon_upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFaviconUpload}
                      />
                    </div>
                  </div>

                  {/* Browser Tab Preview */}
                  <div className="bg-slate-200 p-4 rounded-xl space-y-2 max-w-sm">
                     <div className="text-[10px] font-bold text-slate-500">브라우저 탭 미리보기</div>
                     <div className="bg-white rounded-t-lg border-t border-x border-slate-300 p-2 flex items-center gap-2 w-48 shadow-sm">
                        <div className="w-4 h-4 rounded-sm bg-slate-100 bg-contain bg-center bg-no-repeat flex-shrink-0" style={{ backgroundImage: config.seo_favicon ? `url(${config.seo_favicon})` : 'none' }}>
                            {!config.seo_favicon && <div className="w-full h-full bg-slate-200"></div>}
                        </div>
                        <div className="text-xs text-slate-700 font-medium truncate">{config.seo_title || "Vibefolio"}</div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
