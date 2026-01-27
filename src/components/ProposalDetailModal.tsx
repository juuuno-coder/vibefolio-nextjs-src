"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FontAwesomeIcon } from "@/components/FaIcon";
import { 
  faUser, 
  faCalendar, 
  faEnvelope, 
  faPhone, 
  faCheck, 
  faXmark, 
  faSpinner 
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.locale("ko");

interface ProposalDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: {
    proposal_id: string;
    sender_id: string;
    receiver_id: string;
    title: string;
    content: string;
    contact?: string;
    status: string;
    created_at: string;
    sender?: {
      nickname: string;
      profile_image_url: string;
    };
    Project?: {
      project_id: number;
      title: string;
      thumbnail_url: string;
    };
  } | null;
  onStatusChange?: (proposalId: string, newStatus: string) => void;
}

export function ProposalDetailModal({
  open,
  onOpenChange,
  proposal,
  onStatusChange,
}: ProposalDetailModalProps) {
  const [loading, setLoading] = useState(false);

  if (!proposal) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'accepted': return '수락됨';
      case 'rejected': return '거절됨';
      default: return status;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      // API 호출로 상태 변경 (추후 구현)
      // const res = await fetch(`/api/proposals/${proposal.proposal_id}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ status: newStatus })
      // });
      
      if (onStatusChange) {
        onStatusChange(proposal.proposal_id, newStatus);
      }
      
      alert(newStatus === 'accepted' ? '제안을 수락했습니다.' : '제안을 거절했습니다.');
      onOpenChange(false);
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>제안 상세보기</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* 상태 뱃지 */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
              {getStatusText(proposal.status)}
            </span>
            <span className="text-sm text-gray-500">
              {dayjs(proposal.created_at).format('YYYY.MM.DD HH:mm')}
            </span>
          </div>

          {/* 보낸 사람 정보 */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={proposal.sender?.profile_image_url || '/globe.svg'} />
              <AvatarFallback><FontAwesomeIcon icon={faUser} /></AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{proposal.sender?.nickname || '알 수 없음'}</p>
              <p className="text-sm text-gray-500">보낸 사람</p>
            </div>
          </div>

          {/* 관련 프로젝트 */}
          {proposal.Project && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex gap-3 p-3">
                <img 
                  src={proposal.Project.thumbnail_url || '/placeholder.jpg'} 
                  alt={proposal.Project.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">관련 프로젝트</p>
                  <p className="font-medium text-gray-900 truncate">{proposal.Project.title}</p>
                </div>
              </div>
            </div>
          )}

          {/* 제안 제목 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{proposal.title}</h3>
          </div>

          {/* 제안 내용 */}
          <div>
            <p className="text-sm text-gray-500 mb-2">제안 내용</p>
            <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
              {proposal.content}
            </div>
          </div>

          {/* 연락처 */}
          {proposal.contact && (
            <div className="flex items-center gap-2 text-sm">
              {proposal.contact.includes('@') ? (
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
              ) : (
                <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
              )}
              <span className="text-gray-700">{proposal.contact}</span>
            </div>
          )}

          {/* 액션 버튼 (대기중인 경우에만) */}
          {proposal.status === 'pending' && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button
                onClick={() => handleStatusChange('accepted')}
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheck} className="mr-2" />}
                수락
              </Button>
              <Button
                onClick={() => handleStatusChange('rejected')}
                disabled={loading}
                variant="outline"
                className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
              >
                <FontAwesomeIcon icon={faXmark} className="mr-2" />
                거절
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
