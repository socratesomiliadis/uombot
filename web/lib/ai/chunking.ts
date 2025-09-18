/**
 * Simple token counting approximation
 * Uses character count / 4 as a rough estimate for tokens
 * This is sufficient for chunking purposes without external dependencies
 */
function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface ChunkConfig {
  maxTokens: number;
  overlapTokens: number;
  minChunkTokens: number;
}

export interface Chunk {
  text: string;
  tokenCount: number;
  startIndex: number;
  endIndex: number;
}

export class TextChunker {
  private config: ChunkConfig;

  constructor(config: Partial<ChunkConfig> = {}) {
    this.config = {
      maxTokens: 500,
      overlapTokens: 50,
      minChunkTokens: 50,
      ...config,
    };
  }

  /**
   * Chunk text into smaller pieces suitable for embedding
   */
  chunkText(text: string): Chunk[] {
    if (!text.trim()) {
      return [];
    }

    // First, split by natural boundaries (paragraphs, sections)
    const paragraphs = this.splitByParagraphs(text);
    const chunks: Chunk[] = [];
    let currentChunk = "";
    let currentTokens = 0;
    let startIndex = 0;

    for (const paragraph of paragraphs) {
      const paragraphTokens = countTokens(paragraph);

      // If this paragraph alone exceeds max tokens, split it further
      if (paragraphTokens > this.config.maxTokens) {
        // Save current chunk if it has content
        if (
          currentChunk.trim() &&
          currentTokens >= this.config.minChunkTokens
        ) {
          chunks.push({
            text: currentChunk.trim(),
            tokenCount: currentTokens,
            startIndex,
            endIndex: startIndex + currentChunk.length,
          });
        }

        // Split the large paragraph
        const subChunks = this.splitLargeParagraph(
          paragraph,
          startIndex + currentChunk.length
        );
        chunks.push(...subChunks);

        // Reset for next chunk
        currentChunk = "";
        currentTokens = 0;
        startIndex = startIndex + currentChunk.length + paragraph.length;
        continue;
      }

      // Check if adding this paragraph would exceed the limit
      if (
        currentTokens + paragraphTokens > this.config.maxTokens &&
        currentChunk.trim()
      ) {
        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          tokenCount: currentTokens,
          startIndex,
          endIndex: startIndex + currentChunk.length,
        });

        // Start new chunk with overlap
        const overlap = this.createOverlap(currentChunk);
        currentChunk = overlap + paragraph;
        currentTokens = countTokens(currentChunk);
        startIndex = startIndex + currentChunk.length - overlap.length;
      } else {
        // Add paragraph to current chunk
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
        currentTokens += paragraphTokens;
      }
    }

    // Add final chunk if it has content
    if (currentChunk.trim() && currentTokens >= this.config.minChunkTokens) {
      chunks.push({
        text: currentChunk.trim(),
        tokenCount: currentTokens,
        startIndex,
        endIndex: startIndex + currentChunk.length,
      });
    }

    return chunks.filter(
      (chunk) => chunk.tokenCount >= this.config.minChunkTokens
    );
  }

  /**
   * Split text by paragraphs and other natural boundaries
   */
  private splitByParagraphs(text: string): string[] {
    // Split by double newlines (paragraphs) and other section markers
    const sections = text
      .split(/\n\s*\n/)
      .map((section) => section.trim())
      .filter((section) => section.length > 0);

    // Further split very long sections by sentences
    const result: string[] = [];
    for (const section of sections) {
      if (countTokens(section) > this.config.maxTokens * 0.8) {
        const sentences = this.splitBySentences(section);
        result.push(...sentences);
      } else {
        result.push(section);
      }
    }

    return result;
  }

  /**
   * Split text by sentences
   */
  private splitBySentences(text: string): string[] {
    // Split by sentence endings, but be careful about abbreviations
    const sentences = text
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Group short sentences together
    const result: string[] = [];
    let currentGroup = "";

    for (const sentence of sentences) {
      const groupTokens = countTokens(currentGroup + " " + sentence);

      if (groupTokens > this.config.maxTokens * 0.6 && currentGroup) {
        result.push(currentGroup.trim());
        currentGroup = sentence;
      } else {
        currentGroup += (currentGroup ? " " : "") + sentence;
      }
    }

    if (currentGroup.trim()) {
      result.push(currentGroup.trim());
    }

    return result;
  }

  /**
   * Split a large paragraph that exceeds token limits
   */
  private splitLargeParagraph(paragraph: string, baseIndex: number): Chunk[] {
    const sentences = this.splitBySentences(paragraph);
    const chunks: Chunk[] = [];
    let currentChunk = "";
    let currentTokens = 0;
    let startIndex = baseIndex;

    for (const sentence of sentences) {
      const sentenceTokens = countTokens(sentence);

      if (
        currentTokens + sentenceTokens > this.config.maxTokens &&
        currentChunk.trim()
      ) {
        chunks.push({
          text: currentChunk.trim(),
          tokenCount: currentTokens,
          startIndex,
          endIndex: startIndex + currentChunk.length,
        });

        const overlap = this.createOverlap(currentChunk);
        currentChunk = overlap + sentence;
        currentTokens = countTokens(currentChunk);
        startIndex = startIndex + currentChunk.length - overlap.length;
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence;
        currentTokens += sentenceTokens;
      }
    }

    if (currentChunk.trim() && currentTokens >= this.config.minChunkTokens) {
      chunks.push({
        text: currentChunk.trim(),
        tokenCount: currentTokens,
        startIndex,
        endIndex: startIndex + currentChunk.length,
      });
    }

    return chunks;
  }

  /**
   * Create overlap text from the end of the previous chunk
   */
  private createOverlap(text: string): string {
    if (!text || this.config.overlapTokens === 0) {
      return "";
    }

    // Get the last few sentences for overlap
    const sentences = text.split(/(?<=[.!?])\s+/);
    let overlap = "";
    let overlapTokens = 0;

    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i];
      const tokens = countTokens(sentence);

      if (overlapTokens + tokens <= this.config.overlapTokens) {
        overlap = sentence + (overlap ? " " + overlap : "");
        overlapTokens += tokens;
      } else {
        break;
      }
    }

    return overlap ? overlap + "\n\n" : "";
  }
}

// Default instance with reasonable settings for PDF content
export const textChunker = new TextChunker({
  maxTokens: 400,
  overlapTokens: 50,
  minChunkTokens: 30,
});
