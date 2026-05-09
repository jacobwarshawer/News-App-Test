# The Daily Brief

AI-powered news reader that rewrites articles at different reading depths (Low/Medium/High) and political perspectives (Left/Center/Right), with real-time streaming chat about articles.

Monorepo: `client/` (React + Vite) and `server/` (Express).

## Running the App

```bash
npm run dev              # root — starts both client and server concurrently
cd server && npm test    # Jest test suite
cd client && npm run build  # production build
```

- Server: `http://localhost:5000`
- Client: Vite dev server proxies `/api` → `localhost:5000`

## Environment Setup

Requires `server/.env`:
```
ANTHROPIC_API_KEY=<your key>
```

All AI features (variants and chat) are disabled without this key.

## Architecture

```
client/src/components/   React components (props drilling, no global state)
server/routes/articles.js  All API endpoints
server/services/claude.js  All Anthropic SDK calls (generateVariant, streamChat)
server/constants.js        Model name, system prompts, defaults, token limits
server/data/articles.js    Hardcoded seed article data
```

### Article Object Shape

```js
{
  id: number,
  title: string,
  category: string,       // e.g. "World", "Technology", "Science"
  author: string,
  date: string,           // display string, e.g. "May 5, 2026"
  readTime: string,       // e.g. "5 min read"
  imageUrl: string,
  description: string,    // one-paragraph summary; replaced by variant generation
  content: string,        // full article body; replaced by variant generation
}
```

The list endpoint (`GET /api/articles`) omits `content`. Variant generation replaces `description` and `content` in the response but does not mutate the source data.

## AI Integration

- Model: `claude-haiku-4-5-20251001` — used for both variant generation and chat
- To change the model or prompts, edit `server/constants.js`
- Variant results are cached in-memory (`Map`) keyed by `${id}-${depth}-${perspective}`; cache resets on server restart
- Chat uses SSE streaming (`text/event-stream`)
- Prompt caching is enabled on article content during variant generation

## Code Conventions

- CSS classes: `wr-` prefix, kebab-case (e.g., `wr-card`, `wr-article__main`)
- Components: PascalCase filenames and function names
- HTTP: native `fetch()` only — no Axios
- State: props drilling only — no Redux or Context API
- Git commits: imperative verb, no trailing period (e.g., `Add streaming chat`)

## Testing

Tests live in `server/__tests__/`. Run from the `server/` directory:

```bash
npm test          # run once
npm run test:watch
npm run test:cover
```

The Anthropic SDK is mocked in all tests (`jest.mock('@anthropic-ai/sdk')`). Use the `/test` slash command to run tests and get a formatted report.

## Before You Change Things

- Do not introduce new dependencies without asking
- Do not refactor working code unless asked
- Run `cd server && npm test` after any server changes
- If a task is unclear or a fix isn't working after two attempts, stop and ask rather than continuing to iterate.

## Non-obvious Constraints

- Express v5 (not v4) — some error handling and routing behavior differs
- React 19 is in use
- The perspective slider in the UI is a 0–1 float; it is converted to `"Left"` / `"Center"` / `"Right"` strings before hitting the API — conversion lives in the frontend component


## Clarifying Questions
Before starting any task where ambiguity could moderately affect the 
approach, architecture, or scope — pause and ask me targeted questions first. 
For straightforward tasks, just proceed. Favor asking over assuming when 
the cost of a wrong assumption is high (e.g., deleting data, picking a 
framework, designing an API).