import { embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "../db";
import { cosineDistance, desc, gt, sql, eq } from "drizzle-orm";
import { embeddings, chunks } from "../db/schema/embeddings";
import { resources } from "../db/schema/resources";
import { env } from "../env";

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
    maxParallelCalls: 10,
    model: embeddingModel,
    values: chunks,
    providerOptions: {
      google: {
        outputDimensionality: 1536,
        taskType: "QUESTION_ANSWERING",
      },
    },
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
    providerOptions: {
      google: {
        outputDimensionality: 1536,
        taskType: "QUESTION_ANSWERING",
      },
    },
  });
  return embedding;
};

/**
 * Generate embeddings for document chunks with automatic batching.
 * Uses RETRIEVAL_DOCUMENT task type for optimal document indexing.
 * Handles Gemini's 100-item batch limit automatically.
 */
export const generateDocumentEmbeddings = async (
  texts: string[],
  onProgress?: (batch: number, total: number) => void
): Promise<number[][]> => {
  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];
  const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    onProgress?.(batchNumber, totalBatches);

    const { embeddings: batchEmbeddings } = await embedMany({
      model: embeddingModel,
      values: batch,
      providerOptions: {
        google: {
          outputDimensionality: 1536,
          taskType: "RETRIEVAL_DOCUMENT",
        },
      },
    });

    allEmbeddings.push(...batchEmbeddings);
  }

  return allEmbeddings;
};

// Configuration from environment variables with defaults
const SIMILARITY_THRESHOLD = env.SIMILARITY_THRESHOLD;
const MAX_SOURCES = env.MAX_SOURCES;

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
      resourceTitle: resources.title,
      resourceSource: resources.source,
      resourceType: resources.type,
    })
    .from(embeddings)
    .innerJoin(chunks, eq(embeddings.chunkId, chunks.id))
    .innerJoin(resources, eq(chunks.resourceId, resources.id))
    .where(gt(similarity, SIMILARITY_THRESHOLD))
    .orderBy((t) => desc(t.similarity))
    .limit(MAX_SOURCES);
  return similarGuides;
};
