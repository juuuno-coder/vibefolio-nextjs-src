import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 | 바이브폴리오",
  description: "바이브폴리오에 로그인하여 더 많은 크리에이티브 기능을 경험하세요.",
  openGraph: {
    title: "로그인 | 바이브폴리오",
    description: "바이브폴리오에 로그인하여 더 많은 크리에이티브 기능을 경험하세요.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
