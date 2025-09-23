import { pgTable, text, timestamp, json, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";
import { users } from "./auth";
import { InferSelectModel, sql } from "drizzle-orm";

export const chat = pgTable("chat", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  title: text("title").notNull(),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  chatId: text("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

export type DBMessage = InferSelectModel<typeof message>;
