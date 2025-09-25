import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";
import { DBMessage } from "@/lib/db/schema/chat";
import type { UIDataTypes, UIMessagePart, Tool } from "ai";
import { formatISO } from "date-fns";
import { ChatMessage, ChatTools } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789");

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant" | "system",
    parts: message.parts as any,
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  })) as ChatMessage[];
}
