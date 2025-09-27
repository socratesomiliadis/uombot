"use client";

import { useParams, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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

export function ChatBreadcrumb() {
  const params = useParams();
  const pathname = usePathname();
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const chatId = params?.id as string | undefined;

  useEffect(() => {
    // Clean up previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (chatId) {
      setLoading(true);
      setError(false);

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Fetch chat title from API
      fetch(`/api/chat/${chatId}/title`, {
        signal: abortControllerRef.current.signal,
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error(`Failed to fetch chat title: ${res.status}`);
        })
        .then((data) => {
          setChatTitle(data.title);
          setError(false);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Error fetching chat title:", error);
            setError(true);
            setChatTitle("Untitled Chat");
          }
        })
        .finally(() => {
          if (
            abortControllerRef.current &&
            !abortControllerRef.current.signal.aborted
          ) {
            setLoading(false);
          }
        });
    } else {
      // Reset state when no chat ID
      setChatTitle(null);
      setLoading(false);
      setError(false);
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [chatId]);

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
