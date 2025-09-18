import { db } from "@/lib/db";
import { resources, resourceVersions } from "@/lib/db/schema/resources";
import { chunks, embeddings } from "@/lib/db/schema/embeddings";
import { s3Service } from "@/lib/storage/s3";
import { pdfParser } from "@/lib/pdf/parser";
import { textChunker } from "@/lib/ai/chunking";
import { embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const embeddingModel = google.textEmbedding("gemini-embedding-001");

export interface PDFUploadResult {
  resourceId: string;
  title: string;
  chunksCreated: number;
  embeddingsCreated: number;
}

export interface PDFUploadOptions {
  title?: string;
  lang?: string;
  createdBy?: string;
}

export class PDFPipeline {
  /**
   * Process a PDF file through the complete pipeline:
   * 1. Upload to MinIO
   * 2. Extract text from PDF
   * 3. Create resource record
   * 4. Chunk the text
   * 5. Generate embeddings
   * 6. Store everything in database
   */
  async processPDF(
    pdfBuffer: Buffer,
    fileName: string,
    options: PDFUploadOptions = {}
  ): Promise<PDFUploadResult> {
    try {
      // Step 1: Validate PDF
      if (!pdfParser.isValidPDF(pdfBuffer)) {
        throw new Error("Invalid PDF file");
      }

      // Step 2: Upload to MinIO
      console.log("Uploading PDF to MinIO...");
      const uploadResult = await s3Service.uploadFile(
        pdfBuffer,
        fileName,
        "application/pdf"
      );

      // Step 3: Extract text from PDF
      console.log("Extracting text from PDF...");
      const pdfData = await pdfParser.extractText(pdfBuffer);
      const cleanText = pdfParser.cleanText(pdfData.text);

      if (!cleanText.trim()) {
        throw new Error("No text content could be extracted from the PDF");
      }

      // Step 4: Create content hash for deduplication
      const contentHash = crypto
        .createHash("sha256")
        .update(cleanText)
        .digest("hex");

      // Step 5: Check if we already have this content
      const existingResource = await db
        .select()
        .from(resources)
        .where(eq(resources.contentHash, contentHash))
        .limit(1);

      if (existingResource.length > 0) {
        const resource = existingResource[0];
        const existingChunks = await db
          .select()
          .from(chunks)
          .where(eq(chunks.resourceId, resource.id));

        return {
          resourceId: resource.id,
          title: resource.title || fileName,
          chunksCreated: existingChunks.length,
          embeddingsCreated: existingChunks.length,
        };
      }

      // Step 6: Create resource record
      console.log("Creating resource record...");
      const [resource] = await db
        .insert(resources)
        .values({
          type: "pdf",
          title: options.title || pdfData.metadata.title || fileName,
          source: uploadResult.url,
          lang: options.lang || "en",
          contentHash,
          createdBy: options.createdBy,
          status: "processing",
        })
        .returning();

      // Step 7: Create resource version
      const [resourceVersion] = await db
        .insert(resourceVersions)
        .values({
          resourceId: resource.id,
          version: 1,
          contentHash,
        })
        .returning();

      // Step 8: Chunk the text
      console.log("Chunking text...");
      const textChunks = textChunker.chunkText(cleanText);

      if (textChunks.length === 0) {
        throw new Error("Failed to create chunks from PDF content");
      }

      // Step 9: Store chunks in database
      console.log(`Creating ${textChunks.length} chunks...`);
      const chunkRecords = await db
        .insert(chunks)
        .values(
          textChunks.map((chunk, idx) => ({
            resourceId: resource.id,
            version: resourceVersion.version,
            idx,
            text: chunk.text,
            tokenCount: chunk.tokenCount,
            lang: options.lang || "en",
          }))
        )
        .returning();

      // Step 10: Generate embeddings
      console.log("Generating embeddings...");
      const { embeddings: embeddingVectors } = await embedMany({
        model: embeddingModel,
        values: textChunks.map((chunk) => chunk.text),
      });

      // Step 11: Store embeddings
      console.log("Storing embeddings...");
      await db.insert(embeddings).values(
        chunkRecords.map((chunkRecord, idx) => ({
          chunkId: chunkRecord.id,
          embedding: embeddingVectors[idx],
        }))
      );

      // Step 12: Update resource status to ready
      await db
        .update(resources)
        .set({
          status: "ready",
          updatedAt: new Date(),
        })
        .where(eq(resources.id, resource.id));

      console.log("PDF processing completed successfully!");

      return {
        resourceId: resource.id,
        title: resource.title || fileName,
        chunksCreated: chunkRecords.length,
        embeddingsCreated: embeddingVectors.length,
      };
    } catch (error) {
      console.error("PDF pipeline error:", error);
      throw new Error(
        `PDF processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get processing status of a resource
   */
  async getResourceStatus(resourceId: string) {
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!resource) {
      throw new Error("Resource not found");
    }

    const chunkCount = await db
      .select({ count: chunks.id })
      .from(chunks)
      .where(eq(chunks.resourceId, resourceId));

    const embeddingCount = await db
      .select({ count: embeddings.id })
      .from(embeddings)
      .innerJoin(chunks, eq(embeddings.chunkId, chunks.id))
      .where(eq(chunks.resourceId, resourceId));

    return {
      resource,
      chunkCount: chunkCount.length,
      embeddingCount: embeddingCount.length,
    };
  }

  /**
   * Delete a resource and all associated data
   */
  async deleteResource(resourceId: string) {
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!resource) {
      throw new Error("Resource not found");
    }

    // Delete from S3 if we have a source URL
    if (resource.source) {
      try {
        // Extract key from URL
        const url = new URL(resource.source);
        const key = url.pathname.substring(1); // Remove leading slash
        await s3Service.deleteFile(key);
      } catch (error) {
        console.warn("Failed to delete file from S3:", error);
        // Continue with database cleanup even if S3 deletion fails
      }
    }

    // Database cleanup will be handled by CASCADE constraints
    await db.delete(resources).where(eq(resources.id, resourceId));

    return { success: true };
  }
}

export const pdfPipeline = new PDFPipeline();
