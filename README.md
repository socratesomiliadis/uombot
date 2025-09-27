# UOMBot - University of Macedonia AI Chatbot

An intelligent conversational AI assistant specifically designed for the University of Macedonia in Thessaloniki, Greece. UOMBot provides instant, accurate answers to questions about academic life, courses, admissions, campus services, and university resources through an advanced RAG (Retrieval-Augmented Generation) system.

## 🎯 Overview

UOMBot is a sophisticated AI-powered chatbot that combines the power of Google's Gemini AI with a comprehensive knowledge base of university information. The system processes PDF documents, creates embeddings for semantic search, and provides contextual responses with source citations.

**Key Capabilities:**

- **Smart Document Processing**: Upload and process PDF documents with intelligent chunking and embedding generation
- **Conversational AI**: Natural language interactions powered by Google Gemini 2.5 Flash
- **Source Attribution**: Responses include citations and links to relevant source documents
- **User Management**: Complete authentication system with role-based access control
- **Admin Dashboard**: Administrative interface for managing resources and uploads
- **Multi-language Support**: Configurable language support for international students

## ✨ Features

### 🤖 AI-Powered Conversations

- Natural language processing with context awareness
- Semantic search through university documents
- Source attribution for all responses
- Conversation history and management
- Real-time streaming responses

### 📄 Document Management

- PDF upload and processing pipeline
- Intelligent text extraction and chunking
- Vector embeddings for semantic search
- Deduplication and content hashing
- Admin resource management interface

### 🔐 Authentication & Security

- Secure user authentication with Better Auth
- Role-based access control (User/Admin)
- Session management with token validation
- Protected API endpoints
- Email verification system

### 🎨 Modern UI/UX

- Responsive design with Tailwind CSS
- Dark/light theme support
- Mobile-optimized interface
- Real-time chat interface
- Progress indicators and loading states

### 🚀 High Performance

- Server-side rendering with Next.js 15
- Optimized database queries with Drizzle ORM
- Efficient vector similarity search
- File storage with MinIO/S3 compatibility
- Docker containerization for easy deployment

## 🏗️ Architecture

```mermaid
graph TB
    A[User Interface] --> B[Next.js Frontend]
    B --> C[API Routes]
    C --> D[Authentication Layer]
    D --> E[Chat Engine]
    D --> F[Document Pipeline]

    E --> G[Google Gemini AI]
    E --> H[Vector Search]

    F --> I[PDF Parser]
    F --> J[Text Chunking]
    F --> K[Embedding Generation]

    H --> L[PostgreSQL + pgvector]
    I --> M[MinIO Storage]
    K --> L

    subgraph "Data Layer"
        L
        M
    end

    subgraph "AI Services"
        G
        N[Google Embeddings API]
    end

    K --> N
```

## 🛠️ Technology Stack

### Frontend & Backend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation

### AI & Machine Learning

- **LLM**: Google Gemini 2.5 Flash
- **Embeddings**: Google Generative AI Embeddings
- **Vector Database**: PostgreSQL with pgvector extension
- **PDF Processing**: pdf-parse library
- **Text Chunking**: Custom implementation with token counting

### Database & Storage

- **Database**: PostgreSQL 17 with pgvector
- **ORM**: Drizzle ORM
- **File Storage**: MinIO (S3-compatible)
- **Migrations**: Drizzle Kit

### Authentication & Security

- **Auth System**: Better Auth
- **Session Management**: Token-based with database storage
- **Environment**: T3 Env for type-safe environment variables
- **Validation**: Zod schemas throughout

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload with Next.js
- **Linting**: ESLint with Next.js config
- **Package Manager**: pnpm

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and pnpm
- **Docker** and Docker Compose
- **Google AI API Key** (for Gemini and Embeddings)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/uombot.git
cd uombot
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/uombot
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=uombot

# MinIO/S3 Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=uombot-documents
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# Authentication
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-super-secret-auth-key-here
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Google AI Services
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key-here
```

### 3. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f web
```

This will start:

- **Web Application**: http://localhost:3000
- **PostgreSQL Database**: localhost:5432
- **MinIO Storage**: http://localhost:9000 (Console: http://localhost:9001)

### 4. Development Setup (Alternative)

If you prefer running the web app locally:

```bash
# Start only database and storage
docker-compose up -d db minio

# Install dependencies
cd web
pnpm install

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### 5. Initial Setup

1. **Create MinIO Bucket**:

   - Access MinIO console at http://localhost:9001
   - Login with `minioadmin` / `minioadmin123`
   - Create bucket named `uombot-documents`

2. **Create Admin Account**:

   - Visit http://localhost:3000
   - Sign up with your email
   - Update user role to 'admin' in the database if needed

3. **Upload Documents**:
   - Access admin panel at http://localhost:3000/admin
   - Upload PDF documents for the knowledge base

## 📖 Usage Guide

### For End Users

1. **Sign Up/Sign In**: Create an account or sign in to access the chatbot
2. **Start Chatting**: Ask questions about university services, courses, admissions, etc.
3. **View Sources**: Click on source citations to see referenced documents
4. **Chat History**: Access previous conversations through the sidebar

### For Administrators

1. **Access Admin Panel**: Navigate to `/admin` (requires admin role)
2. **Upload Documents**:
   - Go to `/admin/upload`
   - Select PDF files related to university information
   - Provide titles and language tags
3. **Manage Resources**: View and manage uploaded documents at `/admin/resources`
4. **Monitor Usage**: Check chat logs and user activity

### PDF Document Processing

When you upload a PDF:

1. **File Validation**: System checks file type and size (max 10MB)
2. **Text Extraction**: PDF content is parsed and cleaned
3. **Intelligent Chunking**: Text is split into semantic chunks (~400 tokens)
4. **Embedding Generation**: Google AI creates vector embeddings
5. **Storage**: Chunks and embeddings are stored for semantic search
6. **Deduplication**: Content hashing prevents duplicate processing

## 🔌 API Reference

### PDF Upload API

```typescript
POST /api/upload/pdf
Authorization: Bearer <token>
Content-Type: multipart/form-data

// Form data:
// file: PDF file (max 10MB)
// title: Optional document title
// lang: Language code (default: 'en')
```

### Resource Management

```typescript
GET /api/admin/resources     // List all resources
DELETE /api/upload/pdf?resourceId=<id>  // Delete resource
```

## 🗃️ Database Schema

### Core Tables

- **users**: User accounts with role-based access
- **sessions**: Authentication sessions
- **chats**: Conversation threads
- **messages**: Individual chat messages
- **resources**: Uploaded documents and metadata
- **chunks**: Text segments from documents
- **embeddings**: Vector representations for semantic search

### Vector Search

The system uses PostgreSQL's pgvector extension for efficient similarity search:

```sql
-- Find similar content
SELECT chunk_id, 1 - (embedding <=> query_embedding) as similarity
FROM embeddings
ORDER BY embedding <=> query_embedding
LIMIT 10;
```

## 🚦 Environment Configuration

### Required Environment Variables

| Variable                       | Description                  | Example                               |
| ------------------------------ | ---------------------------- | ------------------------------------- |
| `DATABASE_URL`                 | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `S3_ENDPOINT`                  | MinIO/S3 endpoint URL        | `http://localhost:9000`               |
| `S3_ACCESS_KEY`                | S3 access key                | `minioadmin`                          |
| `S3_SECRET_KEY`                | S3 secret key                | `minioadmin123`                       |
| `S3_BUCKET`                    | S3 bucket name               | `uombot-documents`                    |
| `BETTER_AUTH_URL`              | Base URL for authentication  | `http://localhost:3000`               |
| `BETTER_AUTH_SECRET`           | Secret for auth tokens       | `your-secret-key`                     |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key            | `AIza...`                             |

### Optional Configuration

- `NODE_ENV`: Environment mode (development/production)
- Custom chunking parameters in `lib/ai/chunking.ts`
- File size limits in `app/api/upload/pdf/route.ts`

## 🧪 Development

### Database Operations

```bash
# Generate migrations
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio

# Push schema changes
pnpm db:push
```

### Code Quality

```bash
# Linting
pnpm lint

# Type checking
pnpm build
```

### Docker Development

```bash
# Rebuild specific service
docker-compose build web

# View logs for specific service
docker-compose logs -f web

# Access container shell
docker-compose exec web bash
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MinIO Connection Errors

- Verify MinIO is running: `docker-compose ps`
- Check bucket exists and is accessible
- Validate S3 credentials in environment

#### 2. Database Connection Issues

- Ensure PostgreSQL is running with pgvector extension
- Verify DATABASE_URL format and credentials
- Check if migrations have been applied

#### 3. PDF Processing Failures

- Confirm PDF is not password-protected or corrupted
- Check file size is under 10MB limit
- Verify Google AI API key is valid and has quota

#### 4. Authentication Problems

- Verify BETTER_AUTH_SECRET is set and consistent
- Check if user session has expired
- Ensure BETTER_AUTH_URL matches your domain

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
```

### Health Checks

- **Application**: http://localhost:3000
- **Database**: Check with `docker-compose logs db`
- **MinIO**: http://localhost:9001 (admin console)
- **API Status**: POST to `/api/chat` with valid auth

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add proper error handling and logging
- Include tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **University of Macedonia** for institutional support
- **Google AI** for providing the Gemini API
- **Vercel** for Next.js framework
- **Open Source Community** for all the amazing libraries used

**UOMBot** - Empowering students with AI-driven assistance for academic success at the University of Macedonia.
