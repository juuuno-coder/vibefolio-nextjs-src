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
  const [selectedVersion, setSelectedVersion] = React.useState<ProjectVersion | null>(null);

  // Reset selection when modal closes
  React.useEffect(() => {
      if (!open) setSelectedVersion(null);
  }, [open]);

  const handleCreateClick = () => {
    onOpenChange(false);
    router.push(`/project/upload?mode=version&projectId=${projectId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white text-black max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between mr-8">
             {selectedVersion ? (
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedVersion(null)} className="pl-0 gap-1 text-gray-500 hover:text-black hover:bg-transparent">
                        <ChevronRight className="w-5 h-5 rotate-180" /> 
                        <span className="text-lg font-bold text-gray-900">목록으로</span>
                    </Button>
                 </div>
             ) : (
                 <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    릴리즈 히스토리 (Release History)
                 </DialogTitle>
             )}
             
             {!selectedVersion && isOwner && (
               <Button onClick={handleCreateClick} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 rounded-full px-4">
                 <Plus className="w-4 h-4" /> 새 에피소드
               </Button>
             )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 mt-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {selectedVersion ? (
              // --- 상세 보기 ---
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 px-1">
                  <div className="border-b border-gray-100 pb-4">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedVersion.version_name}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                          <Calendar className="w-4 h-4" />
                          {dayjs(selectedVersion.created_at).format("YYYY년 MM월 DD일 HH:mm")}
                      </div>
                  </div>

                  {/* 본문 렌더링 */}
                  <div className="prose prose-stone max-w-none prose-img:rounded-xl prose-img:shadow-sm">
                      {selectedVersion.content_html ? (
                          <div dangerouslySetInnerHTML={{ __html: selectedVersion.content_html }} />
                      ) : (
                          <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
                              {selectedVersion.content_text || selectedVersion.changelog || "상세 내용이 없습니다."}
                          </p>
                      )}
                  </div>
              </div>
          ) : (
              // --- 목록 보기 ---
              <>
              {versions.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                   <p className="text-sm">아직 발행된 에피소드가 없습니다.</p>
                   {isOwner && <p className="text-xs mt-1">첫 번째 에피소드를 발행해보세요!</p>}
                </div>
              ) : (
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 py-2 pb-10">
                  {versions.map((version, idx) => (
                    <div key={version.id} className="relative pl-6 group">
                       {/* 타임라인 점 */}
                       <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${idx === 0 ? 'bg-green-500' : 'bg-gray-300 group-hover:bg-blue-400 transition-colors'}`} />
                       
                       <div 
                          className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group-hover:border-blue-100"
                          onClick={() => setSelectedVersion(version)}
                       >
                          <div className="flex items-center justify-between mb-2">
                             <h4 className="font-bold text-lg text-gray-800">{version.version_name}</h4>
                             <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                <Calendar className="w-3 h-3" />
                                {dayjs(version.created_at).format("YYYY.MM.DD")}
                             </span>
                          </div>
                          
                          {(version.changelog || version.content_text) && (
                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                              {version.changelog || version.content_text}
                            </p>
                          )}
                          
                          <div className="mt-3 flex items-center text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                             전체 내용 보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
              </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
