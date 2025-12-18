"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// ... (Button, Input etc imports)

function ContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    message: "",
  });

  // URL 쿼리 파라미터에서 제목 가져오기 (예: 광고 문의 시)
  useEffect(() => {
    const titleParam = searchParams.get("title");
    if (titleParam) {
      setFormData(prev => ({ ...prev, title: titleParam }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 전송 중 오류가 발생했습니다.");
      }

      alert("문의가 성공적으로 접수되었습니다.\n담당자가 확인 후 답변드리겠습니다.");
      router.push("/");
    } catch (error: any) {
      console.error("문의 전송 오류:", error);
      alert(error.message || "문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">문의하기</CardTitle>
          <CardDescription className="text-lg mt-2">
            궁금한 점이나 제안하고 싶은 내용을 남겨주세요.<br />
            빠른 시일 내에 답변해 드리겠습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">이름 <span className="text-red-500">*</span></label>
                <Input
                  id="name"
                  name="name"
                  placeholder="홍길동"
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">이메일 <span className="text-red-500">*</span></label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">연락처</label>
              <Input
                id="phone"
                name="phone"
                placeholder="010-1234-5678"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">제목</label>
              <Input
                id="title"
                name="title"
                placeholder="문의 제목을 입력해주세요"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">문의 내용 <span className="text-red-500">*</span></label>
              <Textarea
                id="message"
                name="message"
                placeholder="문의하실 내용을 자세히 적어주세요."
                required
                className="min-h-[150px]"
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  문의하기
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /> 로딩 중...</div>}>
        <ContactForm />
      </Suspense>
    </div>
  );
}
