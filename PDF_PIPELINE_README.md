# PDF Upload and Processing Pipeline

This document describes the complete PDF upload pipeline that handles uploading PDFs to MinIO, extracting text, chunking content, and generating embeddings for semantic search.

## Features

- **PDF Upload to MinIO**: Secure file storage with S3-compatible MinIO
- **Text Extraction**: Advanced PDF parsing with metadata extraction
- **Smart Chunking**: Intelligent text segmentation optimized for embeddings
- **Vector Embeddings**: Google Gemini embedding generation for semantic search
- **Deduplication**: Content hash-based duplicate detection
- **Authentication**: User-based upload tracking with Better Auth

## Architecture

```
PDF File → MinIO Storage → Text Extraction → Chunking → Embeddings → Database
```

### Components

1. **S3Service** (`web/lib/storage/s3.ts`)

   - Handles MinIO/S3 file operations
   - Upload, download, and delete functionality
   - Configurable with environment variables

2. **PDFParser** (`web/lib/pdf/parser.ts`)

   - Extracts text and metadata from PDF files
   - Validates PDF format
   - Cleans and normalizes text content

3. **TextChunker** (`web/lib/ai/chunking.ts`)

   - Intelligent text segmentation
   - Paragraph and sentence-aware chunking
   - Configurable chunk sizes and overlap
   - Token counting for optimal embedding performance

4. **PDFPipeline** (`web/lib/pipeline/pdf-pipeline.ts`)

   - Orchestrates the complete pipeline
   - Handles database operations
   - Error handling and status tracking
   - Deduplication logic

5. **API Endpoint** (`web/app/api/upload/pdf/route.ts`)

   - RESTful API for PDF uploads
   - Authentication middleware
   - File validation and size limits
   - Status checking and resource management

6. **UI Component** (`web/components/pdf-upload.tsx`)
   - User-friendly upload interface
   - Progress tracking
   - Error handling and validation
   - Multi-language support

## Environment Configuration

Add these environment variables to your `.env` file:

```env
# S3/MinIO Configuration
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=your_minio_access_key
S3_SECRET_KEY=your_minio_secret_key
S3_BUCKET=uombot-documents

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/uombot

# Authentication
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your_secret_here
```

## Database Schema

The pipeline uses these database tables:

### Resources

```sql
resources (
  id VARCHAR(191) PRIMARY KEY,
  type TEXT NOT NULL,           -- 'pdf'
  title TEXT,
  source TEXT,                  -- MinIO URL
  lang TEXT,
  content_hash TEXT,            -- SHA256 for deduplication
  created_by TEXT,              -- User ID
  status TEXT DEFAULT 'ready',  -- 'processing', 'ready', 'error'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Chunks

```sql
chunks (
  id VARCHAR(191) PRIMARY KEY,
  resource_id VARCHAR(191) REFERENCES resources(id),
  version INTEGER,
  idx INTEGER,                  -- Chunk order
  lang TEXT,
  text TEXT NOT NULL,
  token_count INTEGER,
  created_at TIMESTAMP
)
```

### Embeddings

```sql
embeddings (
  id VARCHAR(191) PRIMARY KEY,
  chunk_id VARCHAR(191) REFERENCES chunks(id),
  embedding VECTOR(1536)       -- Google Gemini embeddings
)
```

## API Usage

### Upload PDF

```bash
curl -X POST /api/upload/pdf \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "title=Optional Title" \
  -F "lang=en"
```

### Check Status

```bash
curl /api/upload/pdf?resourceId=<resource_id>
```

### Delete Resource

```bash
curl -X DELETE /api/upload/pdf?resourceId=<resource_id>
```

## Pipeline Configuration

### Chunking Settings

```typescript
{
  maxTokens: 400,        // Maximum tokens per chunk
  overlapTokens: 50,     // Overlap between chunks
  minChunkTokens: 30     // Minimum viable chunk size
}
```

### File Limits

- Maximum file size: 10MB
- Supported format: PDF only
- Authentication required

## Error Handling

The pipeline includes comprehensive error handling:

- **Invalid PDF**: File format validation
- **File size**: 10MB limit enforcement
- **Authentication**: User session validation
- **Storage errors**: MinIO connection issues
- **Processing errors**: PDF parsing failures
- **Database errors**: Transaction rollback

## Monitoring and Logging

All operations are logged with appropriate levels:

- Info: Successful operations
- Warn: Non-critical issues (e.g., S3 delete failures)
- Error: Critical failures with full stack traces

## Usage Examples

### Basic Upload (UI)

1. Navigate to `/upload`
2. Select a PDF file
3. Optionally provide title and language
4. Click "Upload PDF"
5. Monitor progress and view results

### Programmatic Upload

```typescript
import { pdfPipeline } from "@/lib/pipeline/pdf-pipeline";

const result = await pdfPipeline.processPDF(pdfBuffer, "document.pdf", {
  title: "My Document",
  lang: "en",
  createdBy: userId,
});
```

## Performance Considerations

- **Chunking**: Optimized for 400-token chunks with 50-token overlap
- **Embeddings**: Batch processing for efficiency
- **Storage**: MinIO provides S3-compatible high-performance storage
- **Database**: pgvector indexes for fast similarity search
- **Deduplication**: Content hashing prevents duplicate processing

## Troubleshooting

### Common Issues

1. **MinIO Connection Failed**

   - Check S3_ENDPOINT is accessible
   - Verify S3_ACCESS_KEY and S3_SECRET_KEY
   - Ensure bucket exists

2. **PDF Parsing Failed**

   - Verify file is a valid PDF
   - Check for password protection
   - Ensure file isn't corrupted

3. **Embedding Generation Failed**

   - Check Google AI API credentials
   - Verify network connectivity
   - Monitor rate limits

4. **Database Errors**
   - Check DATABASE_URL connection
   - Verify pgvector extension is installed
   - Check table permissions

### Logs Location

- Application logs: Console output
- Database logs: PostgreSQL logs
- MinIO logs: MinIO server logs

## Security

- All uploads require authentication
- Files are stored with unique identifiers
- Content hashing prevents data duplication
- User isolation through created_by tracking
- CORS and file type validation

## Future Enhancements

- Support for additional file formats (DOCX, TXT)
- Batch upload capabilities
- Advanced chunking strategies
- OCR for scanned PDFs
- Metadata extraction improvements
- Content versioning
- Admin dashboard for resource management
