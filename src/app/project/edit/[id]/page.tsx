"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function EditProjectPage(props: any) {
  const { params } = props;
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new Tiptap upload page with edit mode
    console.log("Redirecting to modern editor for project:", params.id);
    router.replace(`/project/upload?edit=${params.id}`);
  }, [params.id, router]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-green-600 mb-4" size={48} />
      <p className="text-lg font-medium text-slate-600">에디터 불러오는 중...</p>
    </div>
  );
}
