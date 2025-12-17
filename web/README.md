# UOMBot Web Application

The Next.js 16 web application powering UOMBot — the AI-powered university assistant.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Database Commands

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply pending migrations
pnpm db:migrate

# Push schema directly (dev only)
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

## Key Directories

| Path                  | Description                               |
| --------------------- | ----------------------------------------- |
| `app/`                | Next.js App Router — pages and API routes |
| `app/api/chat/`       | Streaming chat endpoint with RAG          |
| `app/api/upload/pdf/` | PDF upload and processing                 |
| `components/`         | React components                          |
| `lib/ai/`             | Embedding generation and chunking         |
| `lib/db/`             | Drizzle ORM schema and queries            |
| `lib/pipeline/`       | PDF processing pipeline                   |

## Environment

See the root `README.md` for required environment variables. During development, create a `.env` file in the web directory.

## Architecture Notes

- **Streaming**: Uses Vercel AI SDK's `createUIMessageStream` for real-time responses
- **Tools**: LLM uses `understandQuery` and `getInformation` tools for RAG
- **Auth**: Better Auth with cookie-based sessions
- **Styling**: Tailwind CSS 4 with CSS variables for theming
