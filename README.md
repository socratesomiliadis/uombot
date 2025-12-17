# UOMBot — AI-Powered University Assistant

> **Bachelor Thesis Project**  
> Department of Applied Informatics, University of Macedonia, Thessaloniki, Greece

An intelligent conversational AI assistant that leverages Retrieval-Augmented Generation (RAG) to provide accurate, contextual answers about academic life, courses, admissions, and campus services at the University of Macedonia.

## Abstract

This thesis explores the design and implementation of a domain-specific AI chatbot using modern RAG (Retrieval-Augmented Generation) techniques. UOMBot demonstrates how large language models can be augmented with institutional knowledge bases to provide accurate, source-attributed responses while mitigating hallucination—a critical challenge in deploying LLMs for factual question-answering tasks.

## Features

### Core Capabilities

- **RAG-Based Question Answering** — Semantic search through university documents combined with LLM reasoning for accurate, grounded responses
- **Source Attribution** — Every response includes citations linking back to source documents
- **Multi-Step Reasoning** — Query understanding tool generates alternative phrasings to improve retrieval coverage
- **Bilingual Support** — Handles questions in both Greek and English
- **Real-Time Streaming** — Responses stream token-by-token for responsive UX

### Technical Features

- **PDF Processing Pipeline** — Upload, parse, chunk, and embed PDF documents automatically
- **Vector Similarity Search** — HNSW-indexed embeddings for sub-millisecond retrieval
- **User Authentication** — Secure sign-up/sign-in with role-based access control
- **Admin Dashboard** — Resource management interface for uploading and monitoring documents
- **Rate Limiting** — Protection against API abuse with configurable limits
- **Dark/Light Themes** — Accessible UI with theme persistence

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client                                      │
│                         (Next.js Frontend)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API Layer                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   /api/chat  │  │ /api/upload  │  │  /api/admin  │                   │
│  │              │  │     /pdf     │  │  /resources  │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘                   │
└─────────┼─────────────────┼─────────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│   Chat Engine   │  │  PDF Pipeline   │
│                 │  │                 │
│  ┌───────────┐  │  │  ┌───────────┐  │
│  │   Query   │  │  │  │   Parse   │  │
│  │Understanding│ │  │  │   PDF    │  │
│  └─────┬─────┘  │  │  └─────┬─────┘  │
│        ▼        │  │        ▼        │
│  ┌───────────┐  │  │  ┌───────────┐  │
│  │  Vector   │  │  │  │  Chunk    │  │
│  │  Search   │  │  │  │   Text   │  │
│  └─────┬─────┘  │  │  └─────┬─────┘  │
│        ▼        │  │        ▼        │
│  ┌───────────┐  │  │  ┌───────────┐  │
│  │   LLM     │  │  │  │  Generate │  │
│  │ Response  │  │  │  │ Embeddings│  │
│  └───────────┘  │  │  └───────────┘  │
└─────────────────┘  └─────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Data Layer                                      │
│  ┌────────────────────────────┐    ┌────────────────────────────┐       │
│  │   PostgreSQL + pgvector    │    │    MinIO Object Storage    │       │
│  │                            │    │                            │       │
│  │  • users, sessions         │    │  • Original PDF files      │       │
│  │  • chats, messages         │    │  • S3-compatible API       │       │
│  │  • resources, chunks       │    │                            │       │
│  │  • embeddings (1536-dim)   │    │                            │       │
│  └────────────────────────────┘    └────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4 | Server-rendered UI with streaming support |
| **UI Components** | Radix UI, Lucide Icons, Motion | Accessible, animated component library |
| **LLM (Chat)** | Groq API (Kimi K2 Instruct) | Fast inference for conversational responses |
| **Embeddings** | Google AI (gemini-embedding-001) | 1536-dimensional text embeddings |
| **Vector Search** | PostgreSQL + pgvector (HNSW) | Cosine similarity search with indexing |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Authentication** | Better Auth | Session-based auth with role support |
| **Object Storage** | MinIO | S3-compatible PDF storage |
| **Validation** | Zod, T3 Env | Runtime type checking and env validation |
| **AI SDK** | Vercel AI SDK 5 | Unified interface for streaming & tools |

## RAG Implementation

### Pipeline Overview

1. **Query Understanding** — Generates 2 alternative phrasings of the user's question to improve retrieval coverage
2. **Embedding Generation** — User query is embedded using Google's `gemini-embedding-001` model
3. **Vector Search** — Cosine similarity search against chunked document embeddings
4. **Context Assembly** — Top-K relevant chunks are retrieved (configurable threshold: 0.6)
5. **Response Generation** — LLM synthesizes response using retrieved context as grounding
6. **Source Attribution** — Chunks are linked back to their source documents for citation

### Chunking Strategy

Documents are processed using a token-aware chunking algorithm:
- **Target chunk size**: ~400 tokens
- **Overlap**: 50 tokens between chunks
- **Boundary detection**: Paragraph and sentence-aware splitting
- **Deduplication**: SHA-256 content hashing prevents duplicate processing

### Tool-Based Architecture

The chat system uses Vercel AI SDK's tool calling feature:

```typescript
tools: {
  understandQuery: {
    // Generates alternative question phrasings
    // Improves retrieval recall
  },
  getInformation: {
    // Performs vector similarity search
    // Returns relevant document chunks with metadata
  }
}
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Google AI API Key
- Groq API Key

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/yourusername/uombot.git
cd uombot

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f web
```

Services will be available at:
- **Web Application**: http://localhost:3000
- **MinIO Console**: http://localhost:9001
- **PostgreSQL**: localhost:5432

### Development Setup

```bash
# Start database and storage only
docker-compose up -d db minio

# Install dependencies
cd web
pnpm install

# Run migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/uombot

# Object Storage (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=uombot-documents

# Authentication
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key
GROQ_API_KEY=your-groq-api-key

# Optional: Tuning Parameters
SIMILARITY_THRESHOLD=0.6    # Minimum cosine similarity for retrieval
MAX_SOURCES=3               # Maximum chunks to retrieve per query
```

## Project Structure

```
uombot/
├── docker-compose.yml          # Container orchestration
├── README.md                   # This file
│
└── web/                        # Next.js application
    ├── app/                    # App Router pages and API routes
    │   ├── (auth)/            # Authentication pages
    │   ├── admin/             # Admin dashboard
    │   ├── api/               # API endpoints
    │   └── chat/              # Chat interface
    │
    ├── components/            # React components
    │   ├── ai-elements/       # Chat UI components
    │   ├── app-sidebar/       # Navigation sidebar
    │   └── ui/                # Base UI components
    │
    ├── lib/                   # Core library code
    │   ├── ai/                # Embedding & chunking logic
    │   ├── auth/              # Better Auth configuration
    │   ├── db/                # Drizzle schema & queries
    │   ├── pdf/               # PDF parsing utilities
    │   ├── pipeline/          # Document processing pipeline
    │   └── storage/           # S3/MinIO client
    │
    └── hooks/                 # Custom React hooks
```

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with roles (user/admin) |
| `sessions` | Authentication sessions |
| `chats` | Conversation threads |
| `messages` | Chat messages with parts and attachments |
| `resources` | Uploaded documents (PDFs) |
| `chunks` | Text segments from documents |
| `embeddings` | Vector representations (1536-dim) |

### Vector Search Query

```sql
SELECT 
  chunk_id,
  1 - (embedding <=> query_embedding) AS similarity
FROM embeddings
WHERE 1 - (embedding <=> query_embedding) > 0.6
ORDER BY embedding <=> query_embedding
LIMIT 3;
```

## API Reference

### Chat API

```
POST /api/chat
Authorization: Cookie-based session

Request:
{
  "id": "chat-id",
  "messages": [{ "role": "user", "content": "..." }]
}

Response: Server-Sent Events stream
```

### PDF Upload API

```
POST /api/upload/pdf
Authorization: Cookie-based session
Content-Type: multipart/form-data

Form Data:
- file: PDF file (max 10MB)
- title: Optional document title
- lang: Language code (default: 'en')
```

### Admin Resources API

```
GET /api/admin/resources
Authorization: Admin role required

Response:
{
  "resources": [
    { "id": "...", "title": "...", "status": "ready", ... }
  ]
}
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat API | 30 requests | 1 minute |
| Upload API | 10 uploads | 1 hour |
| Admin API | 100 requests | 1 minute |
| Auth API | 10 attempts | 15 minutes |

## Thesis Context

This project was developed as part of a Bachelor's thesis investigating the application of RAG systems in educational contexts. Key research areas include:

1. **Hallucination Mitigation** — How retrieval-augmented approaches reduce factual errors compared to pure LLM responses
2. **Domain Adaptation** — Techniques for grounding general-purpose LLMs with institution-specific knowledge
3. **User Experience** — The impact of source attribution on user trust and response verification
4. **Bilingual Retrieval** — Challenges and solutions for Greek-English cross-lingual information retrieval

## License

This project was developed for academic purposes as part of a Bachelor's thesis at the University of Macedonia.

## Acknowledgments

- **University of Macedonia** — Department of Applied Informatics
- **Google AI** — Gemini API and embedding models
- **Groq** — Fast LLM inference infrastructure
- **Vercel** — AI SDK and Next.js framework
- **Open Source Community** — For the incredible tools that made this possible

---

**UOMBot** — Empowering students with AI-driven assistance for academic success.
