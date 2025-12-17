"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Actions, Action } from "@/components/ai-elements/actions";
import { Fragment, useState } from "react";
import { useChat, UIMessage } from "@ai-sdk/react";
import { Response } from "@/components/ai-elements/response";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { Sources, type SourceData } from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createIdGenerator, DefaultChatTransport } from "ai";

export default function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: UIMessage[];
}) {
  const [input, setInput] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  //   const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: () => {
      console.log("onFinish", { pathname, id, currentPath: pathname });
      // Only redirect if we're on the base /chat page, not if we're already on /chat/[id]
      if (pathname === "/chat") {
        router.push(`/chat/${id}`);
      }
    },
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: input || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          webSearch: false,
        },
      }
    );
    setInput("");
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="max-w-4xl mx-auto p-6 relative size-full">
        <div className="flex flex-col h-full">
          <Conversation>
            <ConversationContent>
              {messages.map((message) => {
                // Extract sources from message parts
                const sourceParts = message.parts.filter(
                  (part) => part.type === "source-url"
                );
                const sources: SourceData[] = sourceParts.map((part: any) => ({
                  sourceId: part.sourceId || "",
                  url: part.url || "",
                  title: part.title || "",
                  type: part.providerMetadata?.custom?.resourceType || "pdf",
                  content: part.providerMetadata?.custom?.content || "",
                  chunkIdx: part.providerMetadata?.custom?.chunkIdx,
                  similarity: part.providerMetadata?.custom?.similarity,
                }));

                return (
                  <div key={message.id} className="space-y-3">
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <Fragment key={`${message.id}-${i}`}>
                              <Message from={message.role}>
                                <MessageContent>
                                  <Response>{part.text}</Response>
                                </MessageContent>
                              </Message>
                              {message.role === "assistant" &&
                                message.id === messages.at(-1)?.id && (
                                  <Actions className="-mt-2">
                                    <Action
                                      onClick={() => regenerate()}
                                      label="Retry"
                                    >
                                      <RefreshCcwIcon className="size-3.5" />
                                    </Action>
                                    <Action
                                      onClick={() =>
                                        navigator.clipboard.writeText(part.text)
                                      }
                                      label="Copy"
                                    >
                                      <CopyIcon className="size-3.5" />
                                    </Action>
                                  </Actions>
                                )}
                            </Fragment>
                          );
                        case "reasoning":
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="w-full"
                              isStreaming={
                                status === "streaming" &&
                                i === message.parts.length - 1 &&
                                message.id === messages.at(-1)?.id
                              }
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        default:
                          return null;
                      }
                    })}

                    {/* Display sources after the message response */}
                    {message.role === "assistant" && sources.length > 0 && (
                      <Sources sources={sources} className="mt-4" />
                    )}
                  </div>
                );
              })}
              {status === "submitted" && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput
            onSubmit={handleSubmit}
            className="mt-4"
            globalDrop
            multiple
          >
            <PromptInputBody>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit disabled={!input && !status} status={status} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
