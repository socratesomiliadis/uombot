import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/embedding";

export const getInformation = ({
  writer,
  writtenSources,
}: {
  writer: UIMessageStreamWriter;
  writtenSources: Set<string>;
}) =>
  tool({
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
  });
