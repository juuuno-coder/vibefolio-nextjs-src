import { Separator } from "@/components/ui/separator";
import { 
  ShieldCheck, 
  AlertCircle, 
  Users, 
  Scale, 
  Gavel, 
  CheckCircle2,
  FileText
} from "lucide-react";

export default function OperationPolicyPage() {
  const sections = [
    {
      id: "ch1",
      icon: <FileText className="w-5 h-5 text-green-600" />,
      title: "제1조 (목적)",
      content: "본 운영정책은 Vibefolio(이하 \"회사\")가 제공하는 서비스(이하 \"서비스\")를 운영함에 있어, 서비스 내에서 발생할 수 있는 문제상황에 대하여 일관성 있게 대처하기 위한 기준과 절차를 규정함을 목적으로 합니다. 회사는 본 정책을 통해 창작자의 권익을 보호하고 건전한 커뮤니티 문화를 조성하고자 합니다."
    },
    {
      id: "ch2",
      icon: <Users className="w-5 h-5 text-blue-600" />,
      title: "제2조 (회원의 의무)",
      content: "모든 회원은 서비스 이용 시 타인의 권리를 존중해야 하며, 다음 각 호의 의무를 준수해야 합니다.",
      list: [
        "타인의 아이디 및 개인정보를 도용하지 않습니다.",
        "서비스의 안정적인 운영을 방해하는 행위를 하지 않습니다.",
        "타인의 게시물에 대해 비방, 욕설 등 명예훼손 행위를 하지 않습니다.",
        "사행심을 조장하거나 상업적인 광고를 허가 없이 게시하지 않습니다."
      ]
    },
    {
      id: "ch3",
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
      title: "제3조 (지적재산권 보호)",
      content: "Vibefolio는 창작자의 소중한 지적재산권을 보호하기 위해 엄격한 기준을 적용합니다.",
      list: [
        "게시물에 포함된 창작물의 저작권은 해당 게시물을 작성한 회원에게 귀속됩니다.",
        "타인의 저작물을 무단으로 복제, 배포하거나 도용하여 게시할 경우 예고 없이 삭제될 수 있습니다.",
        "저작권 침해에 따른 법적 책임은 게시물을 작성한 회원 본인에게 있습니다."
      ]
    },
    {
      id: "ch4",
      icon: <Gavel className="w-5 h-5 text-red-600" />,
      title: "제4조 (이용 제한 로직)",
      content: "회사는 건전한 커뮤니티 환경을 위해 위반 행위의 경중에 따라 다음과 같은 조치를 취할 수 있습니다.",
      list: [
        "1단계: 주의 및 경고 (해당 게시물 비공개 처리)",
        "2단계: 일시 정지 (7일~30일간 서비스 이용 제한)",
        "3단계: 영구 정지 (서비스 이용 계약 해지 및 재가입 제한)"
      ]
    },
    {
      id: "ch5",
      icon: <Scale className="w-5 h-5 text-amber-600" />,
      title: "제5조 (면책 조항)",
      content: "회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우 서비스 제공에 관한 책임이 면제됩니다. 또한 회원의 귀책사유로 인한 서비스 이용 장애에 대하여는 책임을 지지 않습니다."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <section className="bg-slate-950 text-white pt-32 pb-48 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/30 via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest mb-8">
            <Scale size={14} className="text-green-400" />
            <span>Operational Integrity</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">서비스 운영정책</h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Vibefolio는 크리에이터의 열정과 권리를 보호하며,<br />
            모두가 영감을 얻을 수 있는 공정한 커뮤니티를 지향합니다.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-6xl mx-auto px-6 -mt-24 pb-32 pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sticky Quick Nav */}
          <aside className="lg:w-1/4 hidden lg:block">
            <div className="sticky top-32 p-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-4">Index</h4>
              <nav className="space-y-4">
                {sections.map(s => (
                  <a 
                    key={s.id} 
                    href={`#${s.id}`}
                    className="flex items-center gap-3 text-slate-600 hover:text-green-600 transition-colors font-medium group text-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-green-500"></span>
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Policy Detail Sections */}
          <div className="lg:w-3/4 space-y-8">
            {sections.map((section, idx) => (
              <div 
                key={section.id} 
                id={section.id}
                className="bg-white p-10 md:p-16 rounded-[40px] border border-slate-100 shadow-sm scroll-mt-32 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    {section.icon}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {section.title}
                  </h2>
                </div>
                
                <p className="text-slate-600 text-lg leading-relaxed mb-8">
                  {section.content}
                </p>

                {section.list && (
                  <div className="space-y-4">
                    {section.list.map((item, i) => (
                      <div key={i} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100/50">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                        <span className="text-slate-700 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {idx !== sections.length - 1 && (
                  <div className="mt-16 flex justify-center opacity-10">
                    <img src="/logo.svg" alt="" className="w-24" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="bg-slate-50 py-20 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-4" />
          <h4 className="text-slate-900 font-bold mb-2">정책 시행 및 공지</h4>
          <p className="text-slate-500 text-sm leading-relaxed">
            본 정책은 2024년 12월 18일부터 영구히 적용됩니다.<br />
            회사는 정책 변경 시 시행 7일 전 미리 공지사항을 통해 상세 내용을 안내해 드립니다.
          </p>
        </div>
      </section>
    </div>
  );
}
