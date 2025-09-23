import { google } from "@ai-sdk/google";
import {
  createUIMessageStream,
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
  createUIMessageStreamResponse,
  ModelMessage,
  generateId,
} from "ai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/embedding";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from "@/lib/db/queries";
import { generateTitleFromUserMessage } from "@/app/actionts";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, id }: { messages: UIMessage[]; id: string } =
    await req.json();

  const modelMessages = convertToModelMessages(messages).filter(
    (message: ModelMessage) => message.content.length > 0
  );

  const chat = await getChatById({ id });

  if (chat) {
    if (chat.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  } else {
    const title = await generateTitleFromUserMessage({
      message: messages[0],
    });

    await saveChat({
      id,
      userId: session.user.id,
      title,
      visibility: "private",
    });

    await saveMessages({
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        parts: message.parts,
        attachments: [],
        chatId: id,
        userId: session.user.id,
      })),
    });
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({
        type: "start",
        messageId: generateId(), // Generate server-side ID for persistence
      });

      // Track already written sources to avoid duplicates
      const writtenSources = new Set<string>();

      const result = streamText({
        model: google("gemini-2.5-flash"),
        messages: modelMessages,
        stopWhen: stepCountIs(5),
        system: `You are a helpful assistant. Check your knowledge base before answering any questions.
        Only respond to questions using information from tool calls.
        if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
        tools: {
          getInformation: tool({
            description: `get information from your knowledge base to answer questions.`,
            inputSchema: z.object({
              question: z.string().describe("the users question"),
            }),
            execute: async ({ question }) => {
              const results = await findRelevantContent(question);
              results.forEach((result) => {
                // Only add source if it hasn't been written already
                if (!writtenSources.has(result.resourceId)) {
                  writtenSources.add(result.resourceId);
                  writer.write({
                    type: "source-url",
                    sourceId: result.resourceId,
                    url: result.resourceSource || "",
                    title: result.resourceTitle || "",
                  });
                }
              });
              return results;
            },
          }),
        },
        async onError(error) {
          console.error(error);
        },
        async onFinish({
          text,
          toolCalls,
          toolResults,
          usage,
          finishReason,
          response,
        }) {
          // console.log("text", text);
          // console.log("finishReason", finishReason);
          // console.log("toolCalls", toolCalls);
          // console.log("toolResults", toolResults);
          // console.log("usage", usage);
        },
      });

      writer.merge(
        result.toUIMessageStream({
          sendStart: false,
          onFinish: ({ messages }) => {
            writtenSources.clear();
          },
        })
      );
    },
    onFinish: ({ messages }) => {
      const messagesToSave = messages.map((message) => ({
        id: message.id,
        role: message.role,
        parts: message.parts,
        attachments: [],
        chatId: id,
        userId: session.user.id,
      }));
      saveMessages({ messages: messagesToSave });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Bad Request", { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
