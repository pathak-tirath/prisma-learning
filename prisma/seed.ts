import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.author.create({
    data: {
      name: "Ursula K. Le Guin",
      email: "ursula@example.com",
      books: {
        create: [
          { title: "A Wizard of Earthsea", published: 1968 },
          { title: "The Left Hand of Darkness", published: 1969 },
        ],
      },
    },
  });
  console.log("Seeded one author and two books");
} finally {
  await prisma.$disconnect();
}
