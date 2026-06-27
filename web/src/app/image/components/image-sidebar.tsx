"use client";

import { LoaderCircle, MessageSquarePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getImageConversationStats, type ImageConversation } from "@/store/image-conversations";

type ImageSidebarProps = {
  conversations: ImageConversation[];
  isLoadingHistory: boolean;
  selectedConversationId: string | null;
  onCreateDraft: () => void;
  onClearHistory: () => void | Promise<void>;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void | Promise<void>;
  formatConversationTime: (value: string) => string;
  hideActionButtons?: boolean;
};

export function ImageSidebar({
  conversations,
  isLoadingHistory,
  selectedConversationId,
  onCreateDraft,
  onClearHistory,
  onSelectConversation,
  onDeleteConversation,
  formatConversationTime,
  hideActionButtons = false,
}: ImageSidebarProps) {
  return (
    <aside className="h-full min-h-0 overflow-hidden">
      <div className="flex h-full min-h-0 flex-col gap-3">
        {!hideActionButtons && (
          <div className="flex items-center gap-2">
            <Button className="h-10 flex-1 rounded-lg text-white" onClick={onCreateDraft}>
              <MessageSquarePlus className="size-4" />
              新建对话
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-lg border-[#dbeafe] bg-white/75 px-3 text-stone-600 hover:bg-white"
              onClick={() => void onClearHistory()}
              disabled={conversations.length === 0}
              aria-label="清空历史记录"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgba(96,165,250,.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(96,165,250,0.55)] [&::-webkit-scrollbar-track]:bg-transparent">
          {isLoadingHistory ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-stone-500">
              <LoaderCircle className="size-4 animate-spin" />
              正在读取会话记录
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#dbeafe] bg-white/45 px-3 py-4 text-sm leading-6 text-stone-500">
              还没有图片记录，输入创作描述后会在这里显示。
            </div>
          ) : (
            conversations.map((conversation) => {
              const active = conversation.id === selectedConversationId;
              const stats = getImageConversationStats(conversation);
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative w-full rounded-lg border px-3 py-2 text-left transition sm:py-3",
                    active
                      ? "border-[#bfdbfe] bg-[#1e3a8a] text-white shadow-sm"
                      : "border-transparent text-stone-700 hover:border-[#dbeafe] hover:bg-white/52",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className="block w-full pr-8 text-left"
                  >
                    <div className="truncate text-sm font-semibold">
                      <span className="truncate">{conversation.title}</span>
                    </div>
                    <div className={cn("mt-1 text-xs", active ? "text-white/62" : "text-stone-400")}>
                      {conversation.turns.length} 轮 · {formatConversationTime(conversation.updatedAt)}
                    </div>
                    {stats.running > 0 || stats.queued > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        {stats.running > 0 ? (
                          <span className="rounded-full bg-[#eff6ff] px-2 py-1 text-[#2563eb]">处理中 {stats.running}</span>
                        ) : null}
                        {stats.queued > 0 ? (
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">排队 {stats.queued}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteConversation(conversation.id)}
                    className={cn(
                      "absolute top-3 right-2 inline-flex size-7 items-center justify-center rounded-md opacity-0 transition group-hover:opacity-100",
                      active
                        ? "text-white/55 hover:bg-white/10 hover:text-white"
                        : "text-stone-400 hover:bg-red-50 hover:text-red-600",
                    )}
                    aria-label="删除会话"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
