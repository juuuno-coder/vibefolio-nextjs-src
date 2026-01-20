import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faChartPie, faComments, faLightbulb, faStar, faLock } from "@fortawesome/free-solid-svg-icons";

interface FeedbackReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  projectId: string;
}

export function FeedbackReportModal({ open, onOpenChange, projectTitle, projectId }: FeedbackReportModalProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && projectId) {
       const fetchReport = async () => {
          setLoading(true);
          try {
             const res = await fetch(`/api/projects/${projectId}/feedback-report`);
             const data = await res.json();
             if (data.success) {
                setStats(data.stats);
             }
          } catch (e) {
             console.error("Report fetch failed", e);
          } finally {
             setLoading(false);
          }
       };
       fetchReport();
    }
  }, [open, projectId]);

  const renderStars = (score: number) => {
     return <div className="flex gap-1 text-yellow-400 text-xl mb-2">
        {[1, 2, 3, 4, 5].map(i => (
           <FontAwesomeIcon key={i} icon={faStar} className={score >= i ? "text-yellow-400" : "text-gray-200"} />
        ))}
     </div>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 bg-transparent border-none shadow-none text-left">
         <div className="bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10">
                  <FontAwesomeIcon icon={faRocket} className="text-9xl transform rotate-12" />
               </div>
               <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/10">
                     <FontAwesomeIcon icon={faChartPie} /> FEEDBACK REPORT
                  </div>
                  <h2 className="text-3xl font-black mb-1">{projectTitle}</h2>
                  <p className="text-white/60 text-sm">성장하기 피드백 분석 리포트</p>
               </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="p-20 flex justify-center items-center bg-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            ) : !stats ? (
                <div className="p-20 text-center bg-white">데이터를 불러올 수 없습니다.</div>
            ) : (
            <div className="p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
               
               {/* 1. Michelin Score */}
               <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <FontAwesomeIcon icon={faStar} className="text-yellow-400" /> 미슐랭 평점 분석
                  </h3>
                  <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center">
                     <div className="text-5xl font-black text-gray-900 mb-1">{stats.michelinAvg}</div>
                     {renderStars(stats.michelinAvg)}
                     <p className="text-xs text-gray-400 font-medium">총 {stats.totalRatings}명의 평가</p>
                     
                     <div className="w-full mt-6 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((score, i) => (
                           <div key={score} className="flex items-center gap-2 text-xs">
                              <span className="w-4 font-bold text-gray-400">{score}</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                 {/* stats.scoreDistribution is [cnt5, cnt4, cnt3, cnt2, cnt1] */}
                                 <div 
                                    className="h-full bg-yellow-400 transition-all duration-1000" 
                                    style={{ width: `${stats.totalRatings > 0 ? (stats.scoreDistribution[i] / stats.totalRatings) * 100 : 0}%` }}
                                 ></div>
                              </div>
                              <span className="text-[10px] text-gray-400 w-4 text-right">{stats.scoreDistribution[i]}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* 2. Sticker Response */}
               <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <FontAwesomeIcon icon={faLightbulb} className="text-blue-500" /> 스티커 반응
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                     {stats.topStickers.map((sticker: any, i: number) => (
                        <div key={i} className="aspect-square bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center border border-blue-100 p-2 text-center">
                           <span className="text-3xl mb-2">{sticker.icon}</span>
                           <span className="text-lg font-black text-blue-900">{sticker.count}</span>
                           <span className="text-[10px] text-blue-400 font-bold mt-1 line-clamp-1">{sticker.label}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* 3. Proposals & Comments */}
               <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-5 rounded-2xl border border-green-100 flex items-center justify-between">
                     <div>
                        <p className="text-green-800 font-bold text-xs uppercase mb-1">Secret Proposals</p>
                        <p className="text-3xl font-black text-green-900">{stats.secretProposals}건</p>
                     </div>
                     <FontAwesomeIcon icon={faLock} className="text-green-200 text-4xl" />
                  </div>
                  <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex items-center justify-between">
                     <div>
                        <p className="text-purple-800 font-bold text-xs uppercase mb-1">Total Comments</p>
                        <p className="text-3xl font-black text-purple-900">{stats.totalComments}개</p>
                     </div>
                     <FontAwesomeIcon icon={faComments} className="text-purple-200 text-4xl" />
                  </div>
               </div>
            </div>
            )}
         </div>
      </DialogContent>
    </Dialog>
  );
}
