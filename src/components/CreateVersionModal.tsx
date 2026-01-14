"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tag, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface CreateVersionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number | string;
  onSuccess: () => void;
}

export function CreateVersionModal({ open, onOpenChange, projectId, onSuccess }: CreateVersionModalProps) {
  const [versionName, setVersionName] = useState("");
  const [changelog, setChangelog] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!versionName.trim()) {
      alert("버전 이름(예: v1.1)을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("ProjectVersion" as any)
        .insert({
          project_id: Number(projectId),
          version_name: versionName,
          changelog: changelog,
        });

      if (error) throw error;

      alert("새로운 버전이 배포되었습니다! 🚀");
      setVersionName("");
      setChangelog("");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("버전 배포 실패:", error);
      alert("버전 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🚀 프로젝트 새 버전 배포
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Tag className="w-4 h-4" /> 버전 이름
            </label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="예: v1.1, MVP 런칭, 디자인 리뉴얼"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <FileText className="w-4 h-4" /> 변경 사항 (Changelog)
            </label>
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="어떤 점이 달라졌나요? 상세하게 적어주세요."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
            {loading ? "배포 중..." : "배포하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
