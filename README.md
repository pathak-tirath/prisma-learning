# Express + TypeScript + Prisma + PostgreSQL

A small API with `Author` and `Book` tables. It shows both a Prisma relation query (`include`) and an explicit SQL `INNER JOIN` through Prisma's safe tagged `$queryRaw` API.

## Run locally

Requirements: Node.js 22.18+ and Docker with Compose.

```sh
npm install
cp .env.example .env
docker compose up -d db
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

On PowerShell, copy the environment file with `Copy-Item .env.example .env`.

The server listens on `http://localhost:3000`. `npm run build` generates the Prisma client and compiles TypeScript into `dist/`.

## Routes

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| GET | `/authors` | Authors with their books (Prisma `include`) |
| POST | `/authors` | Create `{ "name": "...", "email": "..." }` |
| POST | `/authors/:authorId/books` | Create `{ "title": "...", "published": 2024 }` |
| GET | `/books` | Books with author data (Prisma relation query) |
| GET | `/reports/author-books` | Flat author/book rows using an explicit SQL `INNER JOIN` |

For example:

```sh
curl http://localhost:3000/books
curl http://localhost:3000/reports/author-books
curl -X POST http://localhost:3000/authors -H "Content-Type: application/json" -d '{"name":"Octavia Butler","email":"octavia@example.com"}'
```

The SQL join uses Prisma's tagged template, so values can be parameterized safely if you add request filters. Prisma `include` expresses the same relationship at the model level; Prisma chooses how to fetch it.
