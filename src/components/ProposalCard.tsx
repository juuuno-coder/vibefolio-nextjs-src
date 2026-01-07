"use client";

import { MessageSquare, Calendar, User } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface ProposalCardProps {
  proposal: {
    proposal_id: string;
    sender_id: string;
    receiver_id: string;
    title: string;
    content: string;
    status: string;
    created_at: string;
    sender?: {
      nickname: string;
      profile_image_url: string;
    };
    receiver?: {
      nickname: string;
      profile_image_url: string;
    };
  };
  type: 'sent' | 'received';
  onClick?: () => void;
}

export function ProposalCard({ proposal, type, onClick }: ProposalCardProps) {
  const otherUser = type === 'sent' ? proposal.receiver : proposal.sender;
  
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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-6 border border-gray-200 hover:border-green-600 hover:shadow-md transition-all cursor-pointer"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
            <img
              src={otherUser?.profile_image_url || '/globe.svg'}
              alt={otherUser?.nickname || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {type === 'sent' ? '받는 사람' : '보낸 사람'}: {otherUser?.nickname || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar size={12} />
              {dayjs(proposal.created_at).fromNow()}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
          {getStatusText(proposal.status)}
        </span>
      </div>

      {/* 내용 */}
      <h3 className="font-semibold text-lg mb-2">{proposal.title}</h3>
      <p className="text-gray-600 text-sm line-clamp-2">{proposal.content}</p>

      {/* 푸터 */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
        <MessageSquare size={14} />
        <span>{type === 'sent' ? '보낸 제안' : '받은 문의'}</span>
      </div>
    </div>
  );
}
