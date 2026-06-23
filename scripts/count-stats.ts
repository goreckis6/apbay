import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [categories, entries, games, apps, articles, byType] = await Promise.all([
    prisma.category.count(),
    prisma.entry.count(),
    prisma.entry.count({ where: { type: "game" } }),
    prisma.entry.count({ where: { type: "app" } }),
    prisma.article.count(),
    prisma.category.groupBy({ by: ["type"], _count: true }),
  ]);

  console.log(JSON.stringify({ categories, entries, games, apps, articles, categoriesByType: byType }, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
