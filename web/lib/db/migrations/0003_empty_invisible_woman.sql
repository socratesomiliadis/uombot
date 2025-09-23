ALTER TABLE "Message_v2" RENAME TO "message";--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "Message_v2_chatId_chat_id_fk";
--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;