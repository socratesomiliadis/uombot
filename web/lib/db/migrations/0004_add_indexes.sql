-- Add indexes for better query performance

-- Index on message.chatId for faster chat message retrieval
CREATE INDEX IF NOT EXISTS "message_chat_id_idx" ON "message" ("chatId");

-- Index on message.createdAt for ordering and time-based queries
CREATE INDEX IF NOT EXISTS "message_created_at_idx" ON "message" ("created_at");

-- Composite index for common query pattern (chatId + createdAt)
CREATE INDEX IF NOT EXISTS "message_chat_created_idx" ON "message" ("chatId", "created_at");

-- Index on chat.userId for user's chat history queries
CREATE INDEX IF NOT EXISTS "chat_user_id_idx" ON "chat" ("user_id");

-- Index on chat.createdAt for ordering
CREATE INDEX IF NOT EXISTS "chat_created_at_idx" ON "chat" ("created_at");

-- Index on resources.status for filtering by status
CREATE INDEX IF NOT EXISTS "resources_status_idx" ON "resources" ("status");

-- Index on resources.contentHash for deduplication checks
CREATE INDEX IF NOT EXISTS "resources_content_hash_idx" ON "resources" ("content_hash");

-- Index on chunks.resourceId for resource chunk retrieval
CREATE INDEX IF NOT EXISTS "chunks_resource_id_idx" ON "chunks" ("resource_id");

