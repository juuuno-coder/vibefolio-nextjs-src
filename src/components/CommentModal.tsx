"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.locale("ko");

interface CommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: any[];
  onAddComment: (text: string) => void;
  isLoggedIn: boolean;
  userProfile?: { username: string; profile_image: string };
}

export function CommentModal({
  open,
  onOpenChange,
  comments,
  onAddComment,
  isLoggedIn,
  userProfile,
}: CommentModalProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onAddComment(text);
      setText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!animate-none !duration-0 data-[state=open]:!fade-in-0 data-[state=closed]:!fade-out-0 max-w-[400px] w-full h-[600px] p-0 gap-0 overflow-hidden bg-white rounded-lg shadow-xl"
        showCloseButton={true}
      >
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold">
            댓글 <span className="text-gray-500">({comments.length})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
              <p>아직 댓글이 없습니다.</p>
              <p>첫 번째 댓글을 남겨보세요!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{c.user[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{c.user}</span>
                      <span className="text-xs text-gray-400">
                        {dayjs(c.created_at).fromNow()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {c.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          {isLoggedIn ? (
            <div className="space-y-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="resize-none min-h-[80px] bg-white border-gray-200 focus:border-gray-400 focus:ring-0"
              />
              <div className="flex justify-end gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setText("")}
                >
                    취소
                </Button>
                <Button 
                    size="sm" 
                    onClick={handleSubmit} 
                    disabled={!text.trim()}
                    className="bg-green-600 hover:bg-green-700"
                >
                    댓글 작성
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded p-4 text-center text-sm text-gray-500">
              댓글을 작성하려면 로그인을 해주세요.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
