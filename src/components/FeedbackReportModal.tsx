import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faChartPie, faComments, faLightbulb, faStar, faLock, faDownload, faFileCsv } from "@fortawesome/free-solid-svg-icons";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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

  const handleExportCSV = async () => {
    try {
        const res = await fetch(`/api/projects/${projectId}/ratings`);
        const data = await res.json();
        
        if (!data.success) throw new Error("데이터를 가져오는데 실패했습니다.");

        const ratings = data.ratings;
        const headers = ["ID", "Score", "UX/UI", "Idea", "Biz", "Tech", "Design", "Created At"];
        const csvRows = [
            headers.join(","),
            ...ratings.map((r: any) => [
                r.id,
                r.score,
                r.score_1,
                r.score_2,
                r.score_3,
                r.score_4,
                new Date(r.created_at).toLocaleString()
            ].join(","))
        ];

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `feedback_report_${projectId}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("CSV를 저장했습니다.");
    } catch (err: any) {
        toast.error(err.message);
    }
  };

  const renderStars = (score: number) => {
      return <div className="flex gap-1 text-yellow-400 text-xl mb-2">
         {[1, 2, 3, 4, 5].map(i => (
            <FontAwesomeIcon key={i} icon={faStar} className={score >= i ? "text-yellow-400" : "text-gray-200"} />
         ))}
      </div>;
  };

  const radarData = stats?.categoryAvgs ? [
    { subject: '종합', A: stats.categoryAvgs[0], fullMark: 5 },
    { subject: '기획', A: stats.categoryAvgs[1], fullMark: 5 },
    { subject: '비즈니스', A: stats.categoryAvgs[2], fullMark: 5 },
    { subject: '기술', A: stats.categoryAvgs[3], fullMark: 5 },
    { subject: '디자인', A: stats.categoryAvgs[4], fullMark: 5 },
  ] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none text-left">
         <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                   <FontAwesomeIcon icon={faRocket} className="text-9xl transform rotate-12" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                      <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest mb-3 border border-white/10 uppercase">
                         <FontAwesomeIcon icon={faChartPie} /> Evaluation Dashboard
                      </div>
                      <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter">{projectTitle}</h2>
                      <p className="text-indigo-200/60 text-sm md:text-base font-medium">데이터 중심의 프로젝트 성장 지표 분석</p>
                   </div>
                   <Button 
                     onClick={handleExportCSV}
                     variant="outline" 
                     className="bg-white/5 hover:bg-white text-white hover:text-slate-950 border-white/20 gap-3 font-bold px-8 py-8 h-auto rounded-[2rem] transition-all group shrink-0"
                    >
                      <FontAwesomeIcon icon={faFileCsv} className="text-2xl group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-black opacity-50 tracking-widest leading-none mb-1">Export Data</p>
                        <p className="text-lg leading-none">로데이터 다운로드</p>
                      </div>
                   </Button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="p-24 flex justify-center items-center bg-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                </div>
            ) : !stats ? (
                <div className="p-24 text-center bg-white font-bold text-slate-400">데이터를 불러올 수 없습니다.</div>
            ) : (
            <div className="p-8 md:p-12 bg-white grid grid-cols-1 md:grid-cols-2 gap-10">
               
               {/* 1. Michelin Radar Chart */}
               <div className="space-y-6 md:col-span-2">
                  <h3 className="font-black text-slate-900 flex items-center gap-2 text-2xl tracking-tighter">
                     <FontAwesomeIcon icon={faStar} className="text-amber-500" /> 평가단 정밀 분석 리포트
                  </h3>
                  <div className="bg-slate-50 p-8 rounded-[3rem] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border border-slate-100 shadow-inner">
                     <div className="h-80 w-full bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#f1f5f9" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 900 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                <Radar
                                    name="Score"
                                    dataKey="A"
                                    stroke="#0f172a"
                                    strokeWidth={3}
                                    fill="#6366f1"
                                    fillOpacity={0.2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="space-y-8">
                        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                           <div className="text-8xl font-black text-slate-950 tracking-tighter flex items-end gap-2 leading-none">
                                {stats.michelinAvg} <span className="text-2xl text-slate-300 font-bold mb-3">/ 5.0</span>
                           </div>
                           <div className="scale-110 my-4 transform origin-left">
                                {renderStars(stats.michelinAvg)}
                           </div>
                           <div className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-full border border-slate-200 shadow-sm">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              <p className="text-sm text-slate-500 font-black uppercase tracking-widest">
                                 Total <span className="text-slate-900">{stats.totalRatings} Samples</span>
                              </p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           {radarData.map((d, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-colors">
                                 <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">{d.subject}</span>
                                 <span className="text-lg font-black text-indigo-600">{d.A}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* 2. Voter Distribution & Stickers */}
               <div className="space-y-6">
                  <h3 className="font-black text-slate-900 flex items-center gap-2 text-xl tracking-tight">
                     <FontAwesomeIcon icon={faLightbulb} className="text-blue-500" /> 반응 인포그래픽
                  </h3>
                  <div className="bg-blue-50/50 p-8 rounded-[3rem] border border-blue-100/50 space-y-8 h-full flex flex-col justify-center">
                     <div className="grid grid-cols-3 gap-4">
                        {stats.topStickers.map((sticker: any, i: number) => (
                           <motion.div 
                            key={i} 
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-white rounded-3xl flex flex-col items-center justify-center p-5 text-center shadow-md border border-blue-50"
                           >
                              <span className="text-4xl mb-2">{sticker.icon}</span>
                              <span className="text-2xl font-black text-slate-950">{sticker.count}</span>
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{sticker.label}</span>
                           </motion.div>
                        ))}
                     </div>
                     
                     <div className="pt-8 border-t border-blue-200/50">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Sentiment Distribution</p>
                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((score, i) => (
                               <div key={score} className="flex items-center gap-4 text-xs font-black">
                                  <span className="w-8 text-slate-400">{score}★</span>
                                  <div className="flex-1 h-3 bg-white rounded-full overflow-hidden border border-slate-100">
                                     <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.totalRatings > 0 ? (stats.scoreDistribution[i] / stats.totalRatings) * 100 : 0}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500" 
                                     />
                                  </div>
                                  <span className="text-[10px] text-slate-400 w-6 text-right">{stats.scoreDistribution[i]}</span>
                               </div>
                            ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* 3. Summary Stats */}
               <div className="space-y-6">
                    <h3 className="font-black text-slate-900 flex items-center gap-2 text-xl tracking-tight">
                        <FontAwesomeIcon icon={faComments} className="text-purple-500" /> 커뮤니케이션 대시보드
                    </h3>
                    <div className="flex flex-col gap-4 h-full justify-center">
                        <div className="bg-slate-950 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl shadow-slate-200 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
                              <FontAwesomeIcon icon={faLock} className="text-8xl" />
                           </div>
                           <div className="relative z-10">
                              <p className="font-black text-slate-500 text-[10px] uppercase tracking-widest mb-2">Secret Evaluation Opinions</p>
                              <div className="flex items-end gap-3">
                                 <span className="text-6xl font-black leading-none tracking-tighter">{stats.secretProposals}</span>
                                 <div className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-black mb-1">NEW</div>
                              </div>
                           </div>
                           <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white rounded-full w-14 h-14 relative z-10 border border-white/10">
                                <FontAwesomeIcon icon={faDownload} className="text-xl" />
                           </Button>
                        </div>
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-900 transition-colors">
                           <div>
                              <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-2">Total Comments</p>
                              <div className="flex items-end gap-3 text-slate-950">
                                 <span className="text-6xl font-black leading-none tracking-tighter">{stats.totalComments}</span>
                                 <span className="text-sm font-bold opacity-30 mb-1">Public Feed</span>
                              </div>
                           </div>
                           <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-all">
                                <FontAwesomeIcon icon={faComments} className="text-2xl" />
                           </div>
                        </div>
                    </div>
               </div>
            </div>
            )}
         </div>
      </DialogContent>
    </Dialog>
  );
}
