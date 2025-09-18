import { sql } from "drizzle-orm";
import {
  text,
  varchar,
  timestamp,
  pgTable,
  vector,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";
import { resources } from "./resources";

export const chunks = pgTable("chunks", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  resourceId: varchar("resource_id", { length: 191 })
    .references(() => resources.id, { onDelete: "cascade" })
    .notNull(),
  version: integer("version").notNull(),
  idx: integer("idx").notNull(),
  lang: text("lang"),
  text: text("text").notNull(),
  tokenCount: integer("token_count"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

export const embeddings = pgTable(
  "embeddings",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    chunkId: varchar("chunk_id", { length: 191 })
      .references(() => chunks.id, { onDelete: "cascade" })
      .notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  },
  (table) => [
    index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
