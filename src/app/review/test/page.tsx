"use client";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Review Page Test</h1>
      <div className="space-y-4">
        <p className="text-xl">✅ 페이지가 정상적으로 로드되었습니다!</p>
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">테스트 링크:</h2>
          <ul className="space-y-2">
            <li>
              <a href="/review?projectId=1" className="text-blue-400 hover:underline">
                /review?projectId=1
              </a>
            </li>
            <li>
              <a href="/review?projectId=41" className="text-blue-400 hover:underline">
                /review?projectId=41
              </a>
            </li>
            <li>
              <a href="/review?projectId=60" className="text-blue-400 hover:underline">
                /review?projectId=60
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
