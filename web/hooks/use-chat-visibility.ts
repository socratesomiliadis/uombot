"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { updateChatVisibility } from "@/app/actionts";
import type { ChatHistory } from "@/components/app-sidebar/sidebar-history";
import type { VisibilityType } from "@/components/chat/visibility-selector";

export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
}) {
  const queryClient = useQueryClient();

  const { data: localVisibility, refetch: setLocalVisibility } = useQuery({
    queryKey: [`${chatId}-visibility`],
    queryFn: () => initialVisibilityType,
    initialData: initialVisibilityType,
  });

  const historyData = queryClient.getQueryData(["history"]);

  const visibilityType = useMemo(() => {
    if (
      !historyData ||
      !(typeof historyData === "object" && "pages" in historyData) ||
      !historyData.pages
    ) {
      return localVisibility;
    }

    // Find chat across all pages
    for (const page of historyData.pages as ChatHistory[]) {
      const chat = page.chats.find(
        (currentChat: any) => currentChat.id === chatId
      );
      if (chat) {
        return chat.visibility;
      }
    }

    return "private";
  }, [historyData, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    // Update local visibility
    queryClient.setQueryData([`${chatId}-visibility`], updatedVisibilityType);

    // Invalidate history to refresh data
    queryClient.invalidateQueries({ queryKey: ["history"] });

    updateChatVisibility({
      chatId,
      visibility: updatedVisibilityType,
    });
  };

  return { visibilityType, setVisibilityType };
}
