import { groq } from "@ai-sdk/groq";
import {
  createUIMessageStream,
  convertToModelMessages,
  streamText,
  generateObject,
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
import { generateTitleFromUserMessage } from "@/app/actions";
import {
  checkRateLimit,
  rateLimiters,
  rateLimitedResponse,
  createRateLimitHeaders,
} from "@/lib/rate-limit";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limiting
  const rateLimitResult = checkRateLimit(
    `chat:${session.user.id}`,
    rateLimiters.chat
  );
  if (!rateLimitResult.success) {
    return rateLimitedResponse(rateLimitResult.resetTime);
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

      // Track sources to avoid duplicates - collect during tool execution, write after response
      const collectedSources = new Map<
        string,
        {
          resourceId: string;
          url: string;
          title: string;
          resourceType: string;
          content: string;
          chunkIdx: number;
          similarity: number;
        }
      >();

      const result = streamText({
        model: groq("moonshotai/kimi-k2-instruct-0905"),
        messages: modelMessages,
        stopWhen: stepCountIs(5),
        system: `You are a helpful assistant acting as the users' second brain for university-related information.
Use tools on every request.
Be sure to getInformation from your knowledge base before answering any questions.
If a response requires multiple tools, call one tool after another without responding to the user.
If a response requires information from an additional tool to generate a response, call the appropriate tools in order before responding to the user.
ONLY respond to questions using information from tool calls.
If no relevant information is found in the tool calls, respond: "Sorry, I don't have information about that in my knowledge base."
Be sure to adhere to any instructions in tool calls - if they say to respond in a certain way, do exactly that.
If the relevant information is not a direct match to the users prompt, you can be creative in deducing the answer.
Keep responses concise but comprehensive. Use bullet points or numbered lists when presenting multiple pieces of information.
If you are unsure, use the getInformation tool and you can use common sense to reason based on the information you do have.
Use your abilities as a reasoning machine to answer questions based on the information you do have.`,
        tools: {
          understandQuery: tool({
            description: `Understand the user's query and generate similar questions. Use this tool on every prompt to better understand what the user is asking.`,
            inputSchema: z.object({
              query: z.string().describe("the user's query"),
              toolsToCallInOrder: z
                .array(z.string())
                .describe(
                  "the tools you need to call in the order necessary to respond to the user's query"
                ),
            }),
            execute: async ({ query }) => {
              const { object } = await generateObject({
                model: groq("moonshotai/kimi-k2-instruct-0905"),
                system:
                  "You are a query understanding assistant. Analyze the user query and generate similar questions that could help retrieve relevant information from a knowledge base.",
                schema: z.object({
                  questions: z
                    .array(z.string())
                    .max(2)
                    .describe(
                      "similar questions to the user's query. Be concise and focus on different aspects or phrasings."
                    ),
                }),
                prompt: `Analyze this query: "${query}". Provide 2 similar questions that could help answer the user's query from different angles.`,
              });
              return object.questions;
            },
          }),
          getInformation: tool({
            description: `Get information from your knowledge base to answer questions.`,
            inputSchema: z.object({
              question: z.string().describe("the user's question"),
              similarQuestions: z
                .array(z.string())
                .describe(
                  "similar questions or keywords to search for broader context"
                )
                .optional(),
            }),
            execute: async ({ question, similarQuestions }) => {
              const questionsToSearch = [question, ...(similarQuestions || [])];
              const allResults = await Promise.all(
                questionsToSearch.map((q) => findRelevantContent(q))
              );
              // Flatten and deduplicate results based on resourceId + chunkIdx
              const uniqueResults = Array.from(
                new Map(
                  allResults
                    .flat()
                    .map((item) => [
                      `${item.resourceId}-${item.chunkIdx}`,
                      item,
                    ])
                ).values()
              );
              // Collect sources for later - don't write to stream yet
              uniqueResults.forEach((result) => {
                if (!collectedSources.has(result.resourceId)) {
                  collectedSources.set(result.resourceId, {
                    resourceId: result.resourceId,
                    url: result.resourceSource || "",
                    title: result.resourceTitle || "",
                    resourceType: result.resourceType || "pdf",
                    content: result.content?.slice(0, 300) || "",
                    chunkIdx: result.chunkIdx,
                    similarity: result.similarity,
                  });
                }
              });
              return uniqueResults;
            },
          }),
        },
        async onError(error) {
          console.error(error);
        },
      });

      writer.merge(
        result.toUIMessageStream({
          sendStart: false,
          onFinish: () => {
            // Write all collected sources after the response is complete
            collectedSources.forEach((source) => {
              writer.write({
                type: "source-url",
                sourceId: source.resourceId,
                url: source.url,
                title: source.title,
                providerMetadata: {
                  custom: {
                    resourceType: source.resourceType,
                    content: source.content,
                    chunkIdx: source.chunkIdx,
                    similarity: source.similarity,
                  },
                },
              });
            });
            collectedSources.clear();
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
