import { Separator } from "@/components/ui/separator";
import { Scale, Users, ShieldCheck, FileText, AlertCircle } from "lucide-react";

export default function TermsPage() {
  const highlights = [
    {
      id: "t1",
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: "회원의 정의",
      content: "회원이란 회사와 이용계약을 체결하고 서비스를 이용하는 고객을 의미합니다."
    },
    {
      id: "t2",
      icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
      title: "회사의 의무",
      content: "회사는 법령과 약관이 금지하는 행위를 하지 않으며, 지속적이고 안정적인 서비스를 제공합니다."
    },
    {
      id: "t3",
      icon: <Scale className="w-6 h-6 text-purple-500" />,
      title: "회원의 의무",
      content: "회원은 관계법령, 약관의 규정, 이용안내 등을 준수하여야으며, 업무에 방해되는 행위를 해서는 안 됩니다."
    },
    {
      id: "t4",
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      title: "면책 조항",
      content: "천재지변 또는 이에 준하는 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[40px] p-8 md:p-20 shadow-xl shadow-slate-200/50 border border-slate-100 font-sans">
          {/* Header */}
          <header className="mb-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <FileText className="w-10 h-10 text-slate-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">서비스 이용약관</h1>
            <p className="text-xl text-slate-500 max-w-xl mx-auto">
              Vibefolio 서비스 이용과 관련하여 필요한 권리, 의무 및 책임사항을 안내드립니다.
            </p>
          </header>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-20">
            {highlights.map(h => (
              <div key={h.id} className="p-8 rounded-3xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                <div className="mb-4">{h.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{h.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {h.content}
                </p>
              </div>
            ))}
          </div>

          <Separator className="my-16" />

          {/* Detailed Terms Content */}
          <div className="space-y-12 max-w-3xl mx-auto leading-relaxed text-slate-600">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-slate-800 pl-4">제 1 조 (목적)</h2>
              <p>
                본 약관은 주식회사 바이브(이하 "회사")가 제공하는 바이브폴리오 및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-slate-800 pl-4">제 2 조 (용어의 정의)</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>"서비스"</strong>라 함은 구현되는 단말기(PC, 휴대형단말기 등의 각종 유무선 장치를 포함)와 상관없이 "회원"이 이용할 수 있는 바이브폴리오 및 관련 제반 서비스를 의미합니다.</li>
                <li><strong>"회원"</strong>이라 함은 회사의 "서비스"에 접속하여 본 약관에 따라 "회사"와 이용계약을 체결하고 "회사"가 제공하는 "서비스"를 이용하는 고객을 말합니다.</li>
                <li><strong>"아이디(ID)"</strong>라 함은 "회원"의 식별과 "서비스" 이용을 위하여 "회원"이 정하고 "회사"가 승인하는 문자와 숫자의 조합을 의미합니다.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-slate-800 pl-4">제 3 조 (약관의 게시와 개정)</h2>
              <p className="mb-4">
                "회사"는 본 약관의 내용을 "회원"이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다. 다만, 약관의 내용은 이용자가 연결화면을 통하여 볼 수 있도록 할 수 있습니다.
              </p>
              <p>
                "회사"는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 제1항의 방식에 따라 그 개정약관의 적용일자 7일 전부터 적용일자 전일까지 공지합니다.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-slate-800 pl-4">제 4 조 (회원가입)</h2>
              <p>
                회원가입은 "회원"이 되고자 하는 자(이하 "가입신청자")가 약관의 내용에 대하여 동의를 한 다음 회원가입신청을 하고 "회사"가 이러한 신청에 대하여 승낙함으로써 체결됩니다.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-slate-800 pl-4">제 5 조 (개인정보보호 의무)</h2>
              <p>
                "회사"는 "정보통신망법" 등 관계 법령이 정하는 바에 따라 "회원"의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련 법령 및 "회사"의 개인정보처리방침이 적용됩니다.
              </p>
            </div>
            
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-12">
              <p className="text-sm text-slate-500 font-medium">
                부칙<br/>
                본 약관은 2024년 1월 1일부터 시행됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
