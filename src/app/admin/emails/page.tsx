"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Send, Inbox, Trash2, Plus, RefreshCw } from "lucide-react";

export default function AdminEmailPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  
  // 이메일 발송 폼
  const [sendForm, setForm] = useState({
    from: "vibefolio@vibefolio.net",
    to: "",
    subject: "",
    message: "",
  });

  // 수신 이메일 목록 조회
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/emails");
      const data = await res.json();
      
      if (data.success) {
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error("Failed to fetch emails:", error);
      toast.error("이메일 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  // 이메일 발송
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sendForm.to || !sendForm.subject || !sendForm.message) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    setSendLoading(true);
    try {
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendForm),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("이메일이 발송되었습니다!");
        setForm({
          from: "vibefolio@vibefolio.net",
          to: "",
          subject: "",
          message: "",
        });
      } else {
        toast.error(data.error || "이메일 발송 실패");
      }
    } catch (error) {
      console.error("Send email error:", error);
      toast.error("이메일 발송 중 오류 발생");
    } finally {
      setSendLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">이메일 관리</h1>
            <p className="text-gray-600 mt-1">Resend를 통한 이메일 발송 및 수신 관리</p>
          </div>
          <Button onClick={fetchEmails} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            새로고침
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 이메일 발송 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">이메일 발송</h2>
                <p className="text-sm text-gray-600">사용자에게 이메일 보내기</p>
              </div>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  발신 이메일
                </label>
                <select
                  value={sendForm.from}
                  onChange={(e) => setForm({ ...sendForm, from: e.target.value })}
                  className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="vibefolio@vibefolio.net">vibefolio@vibefolio.net</option>
                  <option value="support@vibefolio.net">support@vibefolio.net</option>
                  <option value="noreply@vibefolio.net">noreply@vibefolio.net</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수신 이메일
                </label>
                <Input
                  type="email"
                  value={sendForm.to}
                  onChange={(e) => setForm({ ...sendForm, to: e.target.value })}
                  placeholder="user@example.com"
                  className="h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <Input
                  type="text"
                  value={sendForm.subject}
                  onChange={(e) => setForm({ ...sendForm, subject: e.target.value })}
                  placeholder="이메일 제목"
                  className="h-11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setForm({ ...sendForm, message: e.target.value })}
                  placeholder="이메일 내용을 입력하세요..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={sendLoading}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {sendLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    이메일 발송
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* 수신 이메일 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Inbox className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">수신 이메일</h2>
                <p className="text-sm text-gray-600">받은 이메일 목록</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">수신된 이메일이 없습니다</p>
                <p className="text-xs text-gray-400 mt-1">
                  Resend Webhook 설정이 필요합니다
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {emails.map((email, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{email.from}</p>
                        <p className="text-sm text-gray-600 mt-1">{email.subject}</p>
                      </div>
                      <span className="text-xs text-gray-400">{email.date}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{email.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 설정 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-3">📧 이메일 수신 설정 (Resend)</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>1. Resend 대시보드</strong> → Domains → vibefolio.net</p>
            <p><strong>2. Inbound</strong> 탭 → Enable Inbound</p>
            <p><strong>3. MX 레코드 추가</strong> (DNS 설정):</p>
            <div className="bg-white p-3 rounded-lg mt-2 font-mono text-xs">
              <p>Type: MX</p>
              <p>Name: @</p>
              <p>Value: inbound.resend.com</p>
              <p>Priority: 10</p>
            </div>
            <p className="mt-3"><strong>4. Webhook 설정</strong> → POST /api/webhooks/resend</p>
          </div>
        </div>
      </div>
    </div>
  );
}
