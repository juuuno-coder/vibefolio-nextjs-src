import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "정책 및 약관 | 바이브폴리오",
};

export default function PolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <article className="prose prose-slate lg:prose-lg hover:prose-a:text-green-600 prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
          {children}
        </article>
      </div>
    </div>
  );
}
