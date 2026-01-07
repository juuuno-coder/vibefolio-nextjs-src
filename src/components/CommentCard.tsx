"use client";

import { MessageCircle, Calendar, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface CommentCardProps {
  comment: {
    comment_id: string;
    content: string;
    created_at: string;
    project_id: number;
    Project?: {
      project_id: number;
      title: string;
      thumbnail_url: string;
      image_url: string;
      user_id?: string;
    };
  };
  onClick?: () => void;
}

export function CommentCard({ comment, onClick }: CommentCardProps) {
  const router = useRouter();
  const project = comment.Project;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (project) {
      router.push(`/?project=${project.project_id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 hover:border-green-600 hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      <div className="flex gap-4 p-4">
        {/* 프로젝트 썸네일 */}
        {project && (
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <OptimizedImage
              src={project.thumbnail_url || project.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
              alt={project.title}
              className="w-full h-full object-cover"
              width={200}
              height={200}
            />
          </div>
        )}

        {/* 댓글 내용 */}
        <div className="flex-1 min-w-0">
          {/* 프로젝트 제목 */}
          {project && (
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-gray-900 truncate">{project.title}</h4>
              <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
            </div>
          )}

          {/* 댓글 내용 */}
          <p className="text-gray-700 text-sm mb-3 line-clamp-2">{comment.content}</p>

          {/* 메타 정보 */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MessageCircle size={12} />
              댓글
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {dayjs(comment.created_at).fromNow()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
