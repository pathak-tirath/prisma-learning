import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { prisma } from "./db.js";

type AuthorBody = {
  name?: unknown;
  email?: unknown;
};

type BookBody = {
  title?: unknown;
  published?: unknown;
};

type AuthorBookRow = {
  authorId: number;
  authorName: string;
  bookId: number;
  bookTitle: string;
  published: number | null;
};

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok" }));

app.get("/authors", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const authors = await prisma.author.findMany({
      include: { books: true },
      orderBy: { name: "asc" },
    });
    res.json(authors);
  } catch (error) {
    next(error);
  }
});

app.post("/authors", async (req: Request<{}, unknown, AuthorBody>, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body;
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim()) {
      res.status(400).json({ error: "name and email are required" });
      return;
    }
    const author = await prisma.author.create({
      data: { name: name.trim(), email: email.trim() },
    });
    res.status(201).json(author);
  } catch (error) {
    next(error);
  }
});

app.post("/authors/:authorId/books", async (req: Request<{ authorId: string }, unknown, BookBody>, res: Response, next: NextFunction) => {
  try {
    const authorId = Number(req.params.authorId);
    const { title, published } = req.body;
    if (
      !Number.isInteger(authorId) ||
      authorId < 1 ||
      typeof title !== "string" ||
      !title.trim() ||
      (published !== undefined &&
        published !== null &&
        (typeof published !== "number" || !Number.isInteger(published)))
    ) {
      res.status(400).json({ error: "A valid authorId and title are required" });
      return;
    }
    const book = await prisma.book.create({
      data: { title: title.trim(), published, authorId },
    });
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
});

app.get("/books", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await prisma.book.findMany({
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { title: "asc" },
    });
    res.json(books);
  } catch (error) {
    next(error);
  }
});

app.get("/reports/author-books", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.$queryRaw<AuthorBookRow[]>`
      SELECT a.id AS "authorId", a.name AS "authorName",
             b.id AS "bookId", b.title AS "bookTitle", b.published
      FROM "Author" AS a
      INNER JOIN "Book" AS b ON b."authorId" = a.id
      ORDER BY a.name, b.title
    `;
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
