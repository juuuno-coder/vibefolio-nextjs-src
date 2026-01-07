// src/app/recruit/[id]/page.tsx
import { Metadata, ResolvingMetadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import RecruitDetailClient from "@/components/recruit/RecruitDetailClient";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

// SEO 메타데이터 동적 생성 (정공법)
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  
  const { data: item } = await supabaseAdmin
    .from('recruit_items')
    .select('*')
    .eq('id', Number(id))
    .single();

  if (!item) {
    return {
      title: '정보를 찾을 수 없습니다 | Vibefolio',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${item.title} | Vibefolio Recruit`,
    description: item.description.substring(0, 160),
    openGraph: {
      title: item.title,
      description: item.description.substring(0, 160),
      url: `https://vibefolio.net/recruit/${id}`,
      siteName: 'Vibefolio',
      images: [
        item.thumbnail || '/images/default-banner.jpg',
        ...previousImages,
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description: item.description.substring(0, 160),
      images: [item.thumbnail || '/images/default-banner.jpg'],
    },
  };
}

export default async function RecruitDetailPage({ params }: Props) {
  const id = params.id;

  // 1. 데이터 가져오기
  const { data: item, error } = await supabaseAdmin
    .from('recruit_items')
    .select('*')
    .eq('id', Number(id))
    .single();

  if (error || !item) {
    notFound();
  }

  // 2. 조회수 증가 (정공법: 서버 사이드 업데이트)
  // 별도의 RPC가 없어도 supabaseAdmin을 사용하면 RLS를 우회하여 안전하게 서버에서 처리 가능
  try {
    const currentViews = item.views_count || 0;
    await supabaseAdmin
      .from('recruit_items')
      .update({ views_count: currentViews + 1 } as any)
      .eq('id', Number(id));
  } catch (e) {
    console.error('Failed to increment views:', e);
  }

  // 3. 클라이언트 컴포넌트로 데이터 전달
  return <RecruitDetailClient item={item} />;
}
