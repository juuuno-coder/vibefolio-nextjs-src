import { Separator } from "@/components/ui/separator";
import { ShieldAlert, Eye, Lock, FileCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      id: "p1",
      icon: <FileCheck className="w-6 h-6 text-blue-500" />,
      title: "개인정보 처리 목적",
      content: "Vibefolio는 서비스 제공, 회원 관리, 신규 서비스 개발 등의 목적으로 최소한의 개인정보를 수집하고 이용합니다."
    },
    {
      id: "p2",
      icon: <Eye className="w-6 h-6 text-green-500" />,
      title: "수집하는 항목 및 방법",
      content: "필수 항목으로는 이메일, 비밀번호, 닉네임이 있으며, 프로필 설정을 통해 관심사 및 프로필 사진을 선택적으로 수집합니다. 모든 정보는 홈페이지 내 직접 입력을 통해 수집됩니다."
    },
    {
      id: "p3",
      icon: <Lock className="w-6 h-6 text-purple-500" />,
      title: "개인정보의 보유 기간",
      content: "회원 탈퇴 시까지 보유하는 것을 원칙으로 하나, 법령에 의거하여 보존 의무가 있는 데이터(결제 기록 등)는 각 법령이 정한 기간(최대 5년) 동안 안전하게 별도 보관됩니다."
    },
    {
      id: "p4",
      icon: <ShieldAlert className="w-6 h-6 text-red-500" />,
      title: "정보주체의 권리와 행사",
      content: "회원은 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 동의 철회 및 회원 탈퇴를 요청할 권리가 있습니다. 마이페이지를 통해 직접 처리하거나 고객센터를 통해 요청하실 수 있습니다."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[40px] p-8 md:p-20 shadow-xl shadow-slate-200/50 border border-slate-100 font-sans">
          {/* Header */}
          <header className="mb-20 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Lock className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">개인정보처리방침</h1>
            <p className="text-xl text-slate-500 max-w-xl mx-auto">
              Vibefolio는 소중한 창작자의 데이터와 프라이버시를 보호하기 위해 최선을 다하고 있습니다.
            </p>
          </header>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-20">
            {sections.map(s => (
              <div key={s.id} className="p-8 rounded-3xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                <div className="mb-4">{s.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {s.content}
                </p>
              </div>
            ))}
          </div>

          <Separator className="my-16" />

          {/* Detailed Content */}
          <div className="space-y-12 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 border-l-4 border-blue-500 pl-4">상세 고지 사항</h2>
            
            <div className="prose prose-slate max-w-none">
              <h4 className="text-lg font-bold text-slate-800 mb-4">가. 개인정보 수집 및 이용 항목</h4>
              <p className="text-slate-600 mb-6">
                당사는 다음과 같이 개인정보를 수집하며, 이용목적 외의 용도로는 사용하지 않습니다.
              </p>
              <table className="w-full text-sm border-collapse rounded-xl overflow-hidden mb-12">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-4 text-left border border-slate-200">구분</th>
                    <th className="p-4 text-left border border-slate-200">수집 항목</th>
                    <th className="p-4 text-left border border-slate-200">목적</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  <tr>
                    <td className="p-4 border border-slate-200 font-bold bg-slate-50">필수</td>
                    <td className="p-4 border border-slate-200">이메일, 비밀번호, 닉네임</td>
                    <td className="p-4 border border-slate-200">회원 식별 및 가입 의사 확인</td>
                  </tr>
                  <tr>
                    <td className="p-4 border border-slate-200 font-bold bg-slate-50">선택</td>
                    <td className="p-4 border border-slate-200">관심분야, 프로필 이미지</td>
                    <td className="p-4 border border-slate-200">맞춤형 콘텐츠 추천 서비스 제공</td>
                  </tr>
                </tbody>
              </table>

              <h4 className="text-lg font-bold text-slate-800 mb-4">나. 개인정보의 자동 수집 장치 (쿠키)</h4>
              <p className="text-slate-600 mb-6 leading-relaxed">
                개별적인 맞춤 서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다. 
                이용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 서비스 이용에 제한이 발생할 수 있습니다.
              </p>
            </div>
          </div>

          {/* Contact Representative */}
          <div className="mt-20 p-8 rounded-3xl bg-blue-50 flex items-center gap-6">
            <img src="/logo.svg" alt="Vibefolio" className="w-16 h-16 opacity-50 hidden sm:block" />
            <div>
              <h4 className="font-bold text-blue-900 mb-2">개인정보 보호 책임자</h4>
              <p className="text-blue-700 text-sm">
                담당: 바이브폴리오 운영팀 <br />
                연락처: support@vibefolio.kr
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
