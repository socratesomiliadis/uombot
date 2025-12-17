import { useMemo } from "react";
import { UIMessage } from "ai";

export interface MessageSource {
  resourceId: string;
  title: string;
  type: string;
  chunkIdx: number;
}

export function useMessageSources(messages: UIMessage[]) {
  return useMemo(() => {
    const sourcesMap = new Map<string, MessageSource[]>();

    messages.forEach((message) => {
      if (message.role === "assistant") {
        // Look for tool invocations in the message (AI SDK uses toolInvocations)
        const toolInvocations = (message as any).toolInvocations;
        if (toolInvocations && toolInvocations.length > 0) {
          const sources: MessageSource[] = [];

          toolInvocations.forEach((invocation: any) => {
            if (invocation.toolName === "getInformation" && invocation.result) {
              const results = invocation.result as any[];
              if (Array.isArray(results)) {
                results.forEach((result) => {
                  if (result.resourceId && result.resourceTitle) {
                    sources.push({
                      resourceId: result.resourceId,
                      title: result.resourceTitle || "Unknown Document",
                      type: result.resourceType || "pdf",
                      chunkIdx: result.chunkIdx || 0,
                    });
                  }
                });
              }
            }
          });

          // Remove duplicates based on resourceId
          const uniqueSources = sources.filter(
            (source, index, self) =>
              index ===
              self.findIndex((s) => s.resourceId === source.resourceId)
          );

          if (uniqueSources.length > 0) {
            sourcesMap.set(message.id, uniqueSources);
          }
        }
      }
    });

    return sourcesMap;
  }, [messages]);
}
