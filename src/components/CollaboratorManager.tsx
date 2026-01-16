"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, UserPlus, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

interface Collaborator {
  id?: string; // Relation ID
  userId?: string;
  email: string;
  username?: string;
  avatarUrl?: string;
}

interface CollaboratorManagerProps {
  projectId?: string; // If present, operates in real-time modification mode
  initialCollaborators?: string[]; // Emails
  onChange?: (emails: string[]) => void; // reports back email list (for new projects)
}

export function CollaboratorManager({ projectId, initialCollaborators = [], onChange }: CollaboratorManagerProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputEmail, setInputEmail] = useState("");

  // Load existing collaborators if projectId exists
  useEffect(() => {
    if (projectId) {
      loadCollaborators();
    } else {
        // Initial state for new project
        setCollaborators(initialCollaborators.map(email => ({ email, username: 'New Member' })));
    }
  }, [projectId]);

  const loadCollaborators = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      const data = await res.json();
      if (data.success) {
        setCollaborators(data.collaborators);
      }
    } catch (e) {
      console.error("Failed to load collaborators", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!inputEmail.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)) {
        toast.error('유효한 이메일 주소를 입력해주세요.');
        return;
    }

    if (collaborators.some(c => c.email === inputEmail)) {
        toast.error('이미 추가된 사용자입니다.');
        return;
    }

    setLoading(true);
    try {
      if (projectId) {
        // Real-time add
        const res = await fetch(`/api/projects/${projectId}/collaborators`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await import("@/lib/supabase/client")).supabase.auth.getSession().then(({data}) => data.session?.access_token)}`
            },
            body: JSON.stringify({ email: inputEmail })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '추가 실패');
        
        toast.success('공동 제작자가 추가되었습니다.');
        setInputEmail("");
        loadCollaborators();
      } else {
        // Local add
        const newCollab = { email: inputEmail, username: 'Pending...' };
        const newList = [...collaborators, newCollab];
        setCollaborators(newList);
        onChange?.(newList.map(c => c.email));
        setInputEmail("");
      }
    } catch (e: any) {
       toast.error(e.message || '추가 중 오류가 발생했습니다.');
    } finally {
       setLoading(false);
    }
  };

  const handleRemove = async (collab: Collaborator) => {
      if (!confirm(`${collab.email} 님을 공동 제작자에서 제외하시겠습니까?`)) return;

      if (projectId) {
          if (!collab.userId) return; // Should not happen for fetched ones
          try {
             // We need to pass userId to delete specifically, or just use the relation ID if we have it?
             // API expects userId in query param? Let's check route.
             // Route: DELETE ...?userId=...
             const res = await fetch(`/api/projects/${projectId}/collaborators?userId=${collab.userId}`, {
                 method: 'DELETE'
             });
             if (!res.ok) throw new Error('삭제 실패');
             
             toast.success('제외되었습니다.');
             loadCollaborators();
          } catch (e) {
              toast.error('제외 실패');
          }
      } else {
          const newList = collaborators.filter(c => c.email !== collab.email);
          setCollaborators(newList);
          onChange?.(newList.map(c => c.email));
      }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
         <ShieldCheck className="w-5 h-5 text-indigo-600" />
         <h3 className="text-lg font-bold text-gray-900">공동 제작자 관리</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        함께 프로젝트를 만든 팀원을 초대하세요. 등록된 포트폴리오에 자동으로 추가되며 수정 권한을 공유합니다.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="팀원 이메일 입력 (예: team@vibefolio.com)"
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
        </div>
        <Button onClick={handleAdd} disabled={loading} variant="secondary">
            <UserPlus className="w-4 h-4 mr-2" />
            추가
        </Button>
      </div>

      <div className="space-y-2 mt-4">
        {collaborators.map((c, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={c.avatarUrl} />
                        <AvatarFallback>{c.username?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{c.username || c.email.split('@')[0]}</span>
                        <span className="text-xs text-gray-500">{c.email}</span>
                    </div>
                </div>
                <button 
                  onClick={() => handleRemove(c)}
                  className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        ))}
        {collaborators.length === 0 && (
            <div className="text-center py-4 text-xs text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                아직 등록된 공동 제작자가 없습니다.
            </div>
        )}
      </div>
    </div>
  );
}
