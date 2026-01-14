import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProjectVersion } from "@/lib/versions";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Tag, ChevronRight } from "lucide-react";

interface VersionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: ProjectVersion[];
  projectId: string;
  isOwner: boolean;
  onSelectVersion?: (version: ProjectVersion) => void;
}

export function VersionHistoryModal({
  open,
  onOpenChange,
  versions,
  projectId,
  isOwner,
  onSelectVersion
}: VersionHistoryModalProps) {
  const router = useRouter();

  const handleCreateClick = () => {
    // 닫고 페이지 이동
    onOpenChange(false);
    router.push(`/project/upload?mode=version&projectId=${projectId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white text-black">
        <DialogHeader>
          <div className="flex items-center justify-between">
             <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Tag className="w-5 h-5" />
                업데이트 히스토리
             </DialogTitle>
             {isOwner && (
               <Button onClick={handleCreateClick} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1 rounded-full px-4">
                 <Plus className="w-4 h-4" /> 새 버전
               </Button>
             )}
          </div>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
          {versions.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
               <p className="text-sm">아직 배포된 버전이 없습니다.</p>
               {isOwner && <p className="text-xs mt-1">첫 번째 버전을 배포해보세요!</p>}
            </div>
          ) : (
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 py-2">
              {versions.map((version, idx) => (
                <div key={version.id} className="relative pl-6 group">
                   {/* 타임라인 점 */}
                   <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${idx === 0 ? 'bg-green-500' : 'bg-gray-300 group-hover:bg-blue-400 transition-colors'}`} />
                   
                   <div 
                      className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group-hover:border-blue-100"
                      onClick={() => onSelectVersion?.(version)}
                   >
                      <div className="flex items-center justify-between mb-1">
                         <h4 className="font-bold text-lg text-gray-800">{version.version_name}</h4>
                         <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                            <Calendar className="w-3 h-3" />
                            {dayjs(version.created_at).format("YYYY.MM.DD")}
                         </span>
                      </div>
                      
                      {version.changelog && (
                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                          {version.changelog}
                        </p>
                      )}
                      
                      <div className="mt-2 flex items-center text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                         상세 보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
