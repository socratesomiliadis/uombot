import { sql } from "drizzle-orm";
import {
  text,
  varchar,
  timestamp,
  pgTable,
  integer,
} from "drizzle-orm/pg-core";

import { nanoid } from "@/lib/utils";

export const resources = pgTable("resources", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  type: text("type").notNull(), // 'pdf' | 'url'
  title: text("title"),
  source: text("source"),
  lang: text("lang"),
  contentHash: text("content_hash"),
  createdBy: text("created_by"),
  status: text("status").notNull().default("ready"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const resourceVersions = pgTable("resource_versions", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  resourceId: varchar("resource_id", { length: 191 })
    .references(() => resources.id, { onDelete: "cascade" })
    .notNull(),
  version: integer("version").notNull(),
  contentHash: text("content_hash"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});
