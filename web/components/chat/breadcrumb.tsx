"use client";

import { useParams, usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type FetchState = {
  chatTitle: string | null;
  loading: boolean;
  error: boolean;
};

export function ChatBreadcrumb() {
  const params = useParams();
  const pathname = usePathname();
  const [state, setState] = useState<FetchState>({
    chatTitle: null,
    loading: false,
    error: false,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const chatId = params?.id as string | undefined;

  const fetchTitle = useCallback(async (id: string, signal: AbortSignal) => {
    try {
      const res = await fetch(`/api/chat/${id}/title`, { signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch chat title: ${res.status}`);
      }
      const data = await res.json();
      setState({ chatTitle: data.title, loading: false, error: false });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error fetching chat title:", err);
        setState({ chatTitle: "Untitled Chat", loading: false, error: true });
      }
    }
  }, []);

  useEffect(() => {
    // Clean up previous request
    abortControllerRef.current?.abort();

    if (!chatId) {
      setState({ chatTitle: null, loading: false, error: false });
      return;
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Set loading state and fetch
    setState((prev) => ({ ...prev, loading: true, error: false }));
    fetchTitle(chatId, controller.signal);

    // Cleanup function
    return () => {
      controller.abort();
    };
  }, [chatId, fetchTitle]);

  const { chatTitle, loading, error } = state;

  const isOnChatPage = pathname === "/chat";
  const isOnSpecificChat = chatId && !isOnChatPage;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/chat" asChild>
            <Link href="/chat">Chat</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {isOnSpecificChat && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[200px] truncate">
                {loading ? (
                  <Skeleton className="h-4 w-20" />
                ) : error ? (
                  <span className="text-muted-foreground">Untitled Chat</span>
                ) : (
                  chatTitle || "Chat"
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
