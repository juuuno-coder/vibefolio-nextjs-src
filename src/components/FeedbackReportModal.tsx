"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faChartPie, faComments, faLightbulb, faStar } from "@fortawesome/free-solid-svg-icons";

interface FeedbackReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  projectId: string;
}

export function FeedbackReportModal({ open, onOpenChange, projectTitle, projectId }: FeedbackReportModalProps) {
  // Placeholder Data
  const stats = {
    michelinAvg: 4.2,
    totalRatings: 18,
    topStickers: [
       { icon: '🚀', count: 42 },
       { icon: '💎', count: 12 },
       { icon: '🔥', count: 8 },
    ],
    secretProposals: 3,
    totalComments: 24
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
            <div className="p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
               
               {/* 1. Michelin Score */}
               <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <FontAwesomeIcon icon={faStar} className="text-yellow-400" /> 미슐랭 평점 분석
                  </h3>
                  <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center">
                     <div className="text-5xl font-black text-gray-900 mb-1">{stats.michelinAvg}</div>
                     <div className="flex gap-1 text-yellow-400 text-xl mb-2">
                        ★★★★☆
                     </div>
                     <p className="text-xs text-gray-400 font-medium">총 {stats.totalRatings}명의 평가</p>
                     
                     <div className="w-full mt-6 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((score, i) => (
                           <div key={score} className="flex items-center gap-2 text-xs">
                              <span className="w-4 font-bold text-gray-400">{score}</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-yellow-400" style={{ width: `${[60, 20, 10, 5, 5][i]}%` }}></div>
                              </div>
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
                     {stats.topStickers.map((sticker, i) => (
                        <div key={i} className="aspect-square bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center border border-blue-100">
                           <span className="text-3xl mb-2">{sticker.icon}</span>
                           <span className="text-lg font-black text-blue-900">{sticker.count}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* 3. Proposals & Comments */}
               <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-5 rounded-2xl border border-green-100 flex items-center justify-between">
                     <div>
                        <p className="text-green-800 font-bold text-xs uppercase mb-1">Received Proposals</p>
                        <p className="text-3xl font-black text-green-900">{stats.secretProposals}건</p>
                     </div>
                     <FontAwesomeIcon icon={faComments} className="text-green-200 text-4xl" />
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
         </div>
      </DialogContent>
    </Dialog>
  );
}
