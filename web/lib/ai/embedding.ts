import { embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "../db";
import { cosineDistance, desc, gt, sql, eq } from "drizzle-orm";
import { embeddings, chunks } from "../db/schema/embeddings";

const embeddingModel = google.textEmbedding("gemini-embedding-001");

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded
  )})`;
  const similarGuides = await db
    .select({
      content: chunks.text,
      similarity,
      chunkId: chunks.id,
      resourceId: chunks.resourceId,
      chunkIdx: chunks.idx,
      version: chunks.version,
    })
    .from(embeddings)
    .innerJoin(chunks, eq(embeddings.chunkId, chunks.id))
    .where(gt(similarity, 0.5))
    .orderBy((t) => desc(t.similarity))
    .limit(4);
  return similarGuides;
};
