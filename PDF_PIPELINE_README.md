# PDF Processing Pipeline — Technical Reference

This document provides detailed technical information about the PDF upload and processing pipeline. For general project information, see the main [README.md](README.md).

## Pipeline Flow

```
PDF Upload → S3 Storage → Text Extraction → Chunking → Embedding → Database
```

## Components

### 1. S3 Service (`web/lib/storage/s3.ts`)

Handles MinIO/S3 file operations using the AWS SDK:

- `uploadFile(key, buffer, contentType)` — Upload file to bucket
- `downloadFile(key)` — Retrieve file as Buffer
- `deleteFile(key)` — Remove file from storage

### 2. PDF Parser (`web/lib/pdf/parser.ts`)

Extracts text content from PDF files:

- Uses `pdf-parse` library for text extraction
- Cleans and normalizes whitespace
- Extracts basic metadata (page count, info)

### 3. Text Chunker (`web/lib/ai/chunking.ts`)

Intelligent text segmentation optimized for embedding:

```typescript
interface ChunkOptions {
  maxTokens: 400; // Target chunk size
  overlapTokens: 50; // Overlap between chunks
  minChunkTokens: 30; // Minimum viable chunk
}
```

**Algorithm:**

1. Split text by paragraphs (double newlines)
2. Further split long paragraphs by sentences
3. Accumulate tokens until `maxTokens` threshold
4. Include overlap from previous chunk
5. Skip chunks below `minChunkTokens`

### 4. PDF Pipeline (`web/lib/pipeline/pdf-pipeline.ts`)

Orchestrates the complete processing flow:

```typescript
async function processPDF(
  buffer: Buffer,
  filename: string,
  options: { title?: string; lang?: string; createdBy?: string }
): Promise<ProcessResult>;
```

**Steps:**

1. Calculate content hash (SHA-256)
2. Check for duplicate content
3. Upload original PDF to MinIO
4. Extract text using PDF parser
5. Chunk text into segments
6. Generate embeddings for each chunk
7. Store chunks and embeddings in database
8. Update resource status

### 5. API Endpoint (`web/app/api/upload/pdf/route.ts`)

RESTful interface for the pipeline:

| Method   | Endpoint                         | Description             |
| -------- | -------------------------------- | ----------------------- |
| `POST`   | `/api/upload/pdf`                | Upload and process PDF  |
| `GET`    | `/api/upload/pdf?resourceId=...` | Check processing status |
| `DELETE` | `/api/upload/pdf?resourceId=...` | Remove resource         |

## Database Tables

### resources

```sql
CREATE TABLE resources (
  id VARCHAR(191) PRIMARY KEY,
  type TEXT NOT NULL,           -- 'pdf'
  title TEXT,
  source TEXT,                  -- MinIO URL/key
  lang TEXT,
  content_hash TEXT,            -- SHA-256 for dedup
  created_by TEXT,
  status TEXT DEFAULT 'ready',  -- processing | ready | error
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### chunks

```sql
CREATE TABLE chunks (
  id VARCHAR(191) PRIMARY KEY,
  resource_id VARCHAR(191) REFERENCES resources(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  idx INTEGER NOT NULL,         -- Chunk order within document
  lang TEXT,
  text TEXT NOT NULL,
  token_count INTEGER,
  created_at TIMESTAMP
);
```

### embeddings

```sql
CREATE TABLE embeddings (
  id VARCHAR(191) PRIMARY KEY,
  chunk_id VARCHAR(191) REFERENCES chunks(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL
);

-- HNSW index for fast similarity search
CREATE INDEX embeddingIndex ON embeddings
  USING hnsw (embedding vector_cosine_ops);
```

## Configuration

### File Limits

- Maximum file size: **10MB**
- Supported format: **PDF only**
- Authentication: **Required**

### Embedding Model

- Provider: Google AI
- Model: `gemini-embedding-001`
- Dimensions: 1536
- Task type: `RETRIEVAL_DOCUMENT`

## Error Handling

The pipeline handles errors at each stage:

| Stage  | Error Type     | Recovery               |
| ------ | -------------- | ---------------------- |
| Upload | File too large | Return 413             |
| Upload | Invalid type   | Return 400             |
| Parse  | Corrupted PDF  | Mark resource as error |
| Chunk  | Empty content  | Skip resource          |
| Embed  | API failure    | Retry with backoff     |
| Store  | DB error       | Transaction rollback   |

## Deduplication

Content deduplication prevents reprocessing identical documents:

1. SHA-256 hash of PDF content
2. Check against existing `content_hash` values
3. If match found, return existing resource ID
4. Otherwise, proceed with processing

## Usage Examples

### Programmatic Upload

```typescript
import { pdfPipeline } from "@/lib/pipeline/pdf-pipeline";

const buffer = await file.arrayBuffer();
const result = await pdfPipeline.processPDF(Buffer.from(buffer), file.name, {
  title: "Course Handbook 2024",
  lang: "en",
  createdBy: session.user.id,
});
```

### API Upload (cURL)

```bash
curl -X POST http://localhost:3000/api/upload/pdf \
  -H "Cookie: better-auth.session_token=..." \
  -F "file=@handbook.pdf" \
  -F "title=Course Handbook" \
  -F "lang=en"
```

### Check Status

```bash
curl http://localhost:3000/api/upload/pdf?resourceId=abc123 \
  -H "Cookie: better-auth.session_token=..."
```

## Performance Notes

- **Chunking**: ~400 tokens balances context vs. retrieval precision
- **Overlap**: 50 tokens ensures context continuity across chunks
- **HNSW Index**: Sub-millisecond similarity search up to millions of vectors
- **Batch Embedding**: Consider batching for large documents (not yet implemented)

## Future Improvements

- [ ] Support for DOCX and TXT formats
- [ ] Batch upload interface
- [ ] OCR for scanned PDFs
- [ ] Chunk versioning for document updates
- [ ] Background job queue for large files
