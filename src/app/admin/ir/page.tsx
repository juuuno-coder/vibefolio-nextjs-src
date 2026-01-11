"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Presentation, Plus, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

interface IRDeck {
  id: number;
  team_name: string;
  title: string;
  description: string;
  updated_at: string;
  slide_count?: number;
}

export default function IRListPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<IRDeck[]>([]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/");
      return;
    }
    if (isAdmin) {
      fetchDecks();
    }
  }, [isAdmin, adminLoading]);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('ir_decks')
        .select(`
          *,
          ir_slides (count)
        `)
        .order('id', { ascending: true });

      if (error) throw error;

      setDecks(data.map((d: any) => ({
        ...d,
        slide_count: d.ir_slides?.[0]?.count || 0
      })));
    } catch (err) {
      console.error(err);
      toast.error("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async () => {
    const teamName = prompt("팀 이름을 입력하세요 (예: Team 6)");
    if (!teamName) return;

    try {
      const { data, error } = await (supabase as any)
        .from('ir_decks')
        .insert([{
          team_name: teamName,
          title: `${teamName} IR Presentation`,
          description: '새로운 IR 자료'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("새로운 덱이 생성되었습니다.");
      fetchDecks();
      router.push(`/admin/ir/${data.id}`);
    } catch (err) {
      toast.error("생성 실패");
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-8 pb-20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Presentation className="text-orange-500" size={36} />
            IR 발표자료 관리
          </h1>
          <p className="text-slate-500 mt-2 font-medium">각 팀의 발표자료 초안을 작성하고 관리합니다.</p>
        </div>
        <Button 
          onClick={handleCreateDeck}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="mr-2" /> 새 팀 추가하기
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => (
          <Link href={`/admin/ir/${deck.id}`} key={deck.id} className="block group">
            <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white overflow-hidden rounded-[28px] h-full">
              <div className="h-40 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                <Presentation size={60} className="text-orange-200 group-hover:text-orange-400 transition-colors" />
              </div>
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    {deck.team_name}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(deck.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                  {deck.title}
                </h3>
                <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                  {deck.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-xs font-bold text-slate-400">
                    {deck.slide_count} 슬라이드
                  </span>
                  <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                    편집하기 <ArrowRight size={16} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
