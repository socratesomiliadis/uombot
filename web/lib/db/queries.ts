import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import { Chat, chat, DBMessage, message } from "./schema/chat";
import { resources } from "./schema/resources";
import { chunks } from "./schema/embeddings";
import { db } from ".";

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: "public" | "private";
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    throw new Error("Failed to save chat", { cause: _error });
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(message).where(eq(message.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new Error("Failed to delete chat by id", { cause: _error });
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${startingAfter} not found`);
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${endingBefore} not found`);
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new Error("Failed to get chats by user id", { cause: _error });
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new Error("Failed to get chat by id", { cause: _error });
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Omit<DBMessage, "createdAt">[];
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new Error("Failed to save messages", { cause: _error });
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    throw new Error("Failed to get messages by chat id", { cause: _error });
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new Error("Failed to get message by id", { cause: _error });
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new Error("Failed to delete messages by chat id after timestamp", {
      cause: _error,
    });
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new Error("Failed to update chat visibility by id", {
      cause: _error,
    });
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new Error("Failed to get message count by user id", {
      cause: _error,
    });
  }
}

// Resource management queries
export async function getAllResources({
  limit = 50,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}) {
  try {
    const results = await db
      .select({
        id: resources.id,
        type: resources.type,
        title: resources.title,
        source: resources.source,
        lang: resources.lang,
        contentHash: resources.contentHash,
        createdBy: resources.createdBy,
        status: resources.status,
        createdAt: resources.createdAt,
        updatedAt: resources.updatedAt,
        chunkCount: count(chunks.id),
      })
      .from(resources)
      .leftJoin(chunks, eq(resources.id, chunks.resourceId))
      .groupBy(resources.id)
      .orderBy(desc(resources.createdAt))
      .limit(limit)
      .offset(offset);

    return results;
  } catch (_error) {
    throw new Error("Failed to get all resources", { cause: _error });
  }
}

export async function getResourceById({ id }: { id: string }) {
  try {
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id));

    if (!resource) {
      return null;
    }

    // Get chunk count for this resource
    const [chunkStats] = await db
      .select({ count: count(chunks.id) })
      .from(chunks)
      .where(eq(chunks.resourceId, id));

    return {
      ...resource,
      chunkCount: chunkStats?.count ?? 0,
    };
  } catch (_error) {
    throw new Error("Failed to get resource by id", { cause: _error });
  }
}

export async function deleteResourceById({ id }: { id: string }) {
  try {
    // Delete chunks first (due to foreign key constraint)
    await db.delete(chunks).where(eq(chunks.resourceId, id));

    // Delete the resource
    const [deletedResource] = await db
      .delete(resources)
      .where(eq(resources.id, id))
      .returning();

    return deletedResource;
  } catch (_error) {
    throw new Error("Failed to delete resource by id", { cause: _error });
  }
}

export async function updateResourceStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  try {
    const [updatedResource] = await db
      .update(resources)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(resources.id, id))
      .returning();

    return updatedResource;
  } catch (_error) {
    throw new Error("Failed to update resource status", { cause: _error });
  }
}

export async function getResourceStats() {
  try {
    const [totalResources] = await db
      .select({ count: count(resources.id) })
      .from(resources);

    const [totalChunks] = await db
      .select({ count: count(chunks.id) })
      .from(chunks);

    const statusStats = await db
      .select({
        status: resources.status,
        count: count(resources.id),
      })
      .from(resources)
      .groupBy(resources.status);

    const typeStats = await db
      .select({
        type: resources.type,
        count: count(resources.id),
      })
      .from(resources)
      .groupBy(resources.type);

    return {
      totalResources: totalResources?.count ?? 0,
      totalChunks: totalChunks?.count ?? 0,
      statusStats,
      typeStats,
    };
  } catch (_error) {
    throw new Error("Failed to get resource stats", { cause: _error });
  }
}
