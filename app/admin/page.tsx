import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [gamesCount, appsCount, articlesCount, categoriesCount] = await Promise.all([
    prisma.entry.count({ where: { type: "game" } }),
    prisma.entry.count({ where: { type: "app" } }),
    prisma.article.count(),
    prisma.category.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/entries?type=game" className="block p-6 bg-white rounded-xl shadow">
          <h2 className="text-slate-500 text-sm font-medium">Games</h2>
          <p className="text-3xl font-bold text-slate-800 mt-1">{gamesCount}</p>
        </Link>
        <Link href="/admin/entries?type=app" className="block p-6 bg-white rounded-xl shadow">
          <h2 className="text-slate-500 text-sm font-medium">Apps</h2>
          <p className="text-3xl font-bold text-slate-800 mt-1">{appsCount}</p>
        </Link>
        <Link href="/admin/articles" className="block p-6 bg-white rounded-xl shadow">
          <h2 className="text-slate-500 text-sm font-medium">Articles</h2>
          <p className="text-3xl font-bold text-slate-800 mt-1">{articlesCount}</p>
        </Link>
        <Link href="/admin/categories" className="block p-6 bg-white rounded-xl shadow">
          <h2 className="text-slate-500 text-sm font-medium">Categories</h2>
          <p className="text-3xl font-bold text-slate-800 mt-1">{categoriesCount}</p>
        </Link>
      </div>
    </div>
  );
}
