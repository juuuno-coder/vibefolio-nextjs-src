import { Separator } from "@/components/ui/separator";

export default function OperationPolicyPage() {
  const sections = [
    {
      id: "ch1",
      title: "제1조 (목적)",
      content: "본 운영정책은 Vibefolio(이하 \"회사\")가 제공하는 서비스(이하 \"서비스\")를 운영함에 있어, 서비스 내에서 발생할 수 있는 문제상황에 대하여 일관성 있게 대처하기 위한 기준과 절차를 규정함을 목적으로 합니다."
    },
    {
      id: "ch2",
      title: "제2조 (용어의 정의)",
      list: [
        "\"회원\"이라 함은 회사의 약관에 동의하고 서비스를 이용하는 자를 말합니다.",
        "\"게시물\"이라 함은 회원이 서비스를 이용함에 있어 서비스 상에 게시한 각종 창작물, 부호, 문자, 화상, 동영상 등을 의미합니다.",
        "\"커뮤니티 가이드\"라 함은 건전한 서비스 환경 조성을 위해 회사가 별도로 공지하는 지침을 말합니다."
      ]
    },
    {
      id: "ch3",
      title: "제3조 (이용 제한 기준)",
      content: "회사는 회원이 다음 각 호에 해당하는 행위를 한 경우, 단계별 이용 제한(주의, 일시 정지, 영구 정지) 조치를 취할 수 있습니다.",
      list: [
        "타인의 지적재산권(저작권 등)을 침해하는 창작물을 게시하는 경우",
        "타인의 명예를 훼손하거나 개인정보를 유출하는 행위",
        "광고성 스팸 게시물 또는 서비스 운영을 방해하는 행위",
        "특정 집단에 대한 혐오 표현 및 차별적 게시물",
        "기타 커뮤니티 가이드 및 법령을 위반하는 행위"
      ]
    },
    {
      id: "ch4",
      title: "제4조 (창작자의 권리 보호)",
      content: "Vibefolio는 창작자의 권리를 최우선으로 합니다. 허락되지 않은 무단 전재 및 재배포가 확인될 경우, 회사는 피해 회원을 위해 최대한의 기술적/운영적 지원을 제공합니다."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-32">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 px-4">Contents</h2>
            <nav className="space-y-1">
              {sections.map(section => (
                <a 
                  key={section.id}
                  href={`#${section.id}`} 
                  className="block px-4 py-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all text-sm font-medium"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-white rounded-[32px] p-8 md:p-16 shadow-sm border border-slate-100">
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">서비스 운영정책</h1>
            <p className="text-slate-500">최종 수정일: 2024년 12월 18일</p>
          </header>

          <div className="space-y-16">
            {sections.map(section => (
              <section key={section.id} id={section.id} className="scroll-mt-32">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                  {section.title}
                </h2>
                
                {section.content && (
                  <p className="text-slate-700 leading-relaxed mb-6 text-lg">
                    {section.content}
                  </p>
                )}

                {section.list && (
                  <ul className="space-y-4">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex gap-4 text-slate-600 text-lg leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                        <span className="text-green-600 font-bold">{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Separator className="mt-12 opacity-50" />
              </section>
            ))}
          </div>

          {/* Footer Info */}
          <footer className="mt-20 pt-10 border-t border-slate-100 text-center text-slate-400 text-sm">
            <p>© Vibefolio Team. 본 운영정책은 서비스 개선을 위해 예고 없이 변경될 수 있습니다.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
