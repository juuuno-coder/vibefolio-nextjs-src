"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Send, Inbox, Trash2, RefreshCw, Reply, X, Eye } from "lucide-react";

export default function AdminEmailPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [isReplyMode, setIsReplyMode] = useState(false);
  
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
        setIsReplyMode(false);
        setSelectedEmail(null);
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

  // 답장 모드 활성화
  const handleReply = (email: any) => {
    setIsReplyMode(true);
    setForm({
      from: email.to_email || "vibefolio@vibefolio.net",
      to: email.from_email,
      subject: `Re: ${email.subject}`,
      message: `\n\n---\n원본 메시지:\n발신: ${email.from_email}\n제목: ${email.subject}\n\n${email.text_content || ""}`,
    });
    setSelectedEmail(null);
  };

  useEffect(() => {
    fetchEmails();
    // 30초마다 자동 새로고침
    const interval = setInterval(fetchEmails, 30000);
    return () => clearInterval(interval);
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
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 이메일 발송 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isReplyMode ? "답장 작성" : "이메일 발송"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {isReplyMode ? "수신 이메일에 답장하기" : "사용자에게 이메일 보내기"}
                  </p>
                </div>
              </div>
              {isReplyMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsReplyMode(false);
                    setForm({
                      from: "vibefolio@vibefolio.net",
                      to: "",
                      subject: "",
                      message: "",
                    });
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  취소
                </Button>
              )}
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
                  disabled={isReplyMode}
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
                  rows={isReplyMode ? 12 : 8}
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
                    {isReplyMode ? "답장 보내기" : "이메일 발송"}
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
                <p className="text-sm text-gray-600">
                  vibefolio@, support@ 수신함 ({emails.length}개)
                </p>
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
                  MX 레코드 설정 후 이메일을 받을 수 있습니다
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {emails.map((email, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 truncate">{email.from_email}</p>
                          <span className="text-xs text-gray-400 shrink-0">
                            {new Date(email.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate">{email.subject}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          수신: {email.to_email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReply(email);
                        }}
                        className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Reply className="w-3 h-3" />
                        답장
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {email.text_content || "(내용 없음)"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 이메일 상세 모달 */}
        {selectedEmail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">이메일 상세</h3>
                    <p className="text-sm text-gray-600">{selectedEmail.from_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleReply(selectedEmail)}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Reply className="w-4 h-4" />
                    답장
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedEmail(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">제목</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">{selectedEmail.subject}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">발신</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedEmail.from_email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">수신</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedEmail.to_email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">수신 시간</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(selectedEmail.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">내용</label>
                    <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {selectedEmail.text_content || "(내용 없음)"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
