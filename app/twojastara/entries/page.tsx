import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import EntryListWithGenerate from "./EntryListWithGenerate";
import Pagination from "@/app/components/Pagination";

const PER_PAGE = 100;

export default async function AdminEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string; search?: string }>;
}) {
  const { type, page, search } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const skip = (currentPage - 1) * PER_PAGE;

  const where: Prisma.EntryWhereInput = type ? { type: type as "game" | "app" } : {};
  if (search?.trim()) {
    const term = search.trim();
    where.OR = [
      { title: { contains: term } },
      { slug: { contains: term } },
    ];
  }
  const [entries, totalCount] = await Promise.all([
    prisma.entry.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: PER_PAGE,
    }),
    prisma.entry.count({ where }),
  ]);

  const queryParams: Record<string, string> = {};
  if (type) queryParams.type = type;
  if (search?.trim()) queryParams.search = search.trim();

  return (
    <div suppressHydrationWarning>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Games & Apps</h1>
        <Link href="/twojastara/entries/new" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium">
          Add New
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <Link href={search?.trim() ? `/twojastara/entries?search=${encodeURIComponent(search.trim())}` : "/twojastara/entries"} className={`px-4 py-2 rounded-lg ${!type ? "bg-amber-500 text-white" : "bg-white text-slate-600"}`}>
          All
        </Link>
        <Link href={search?.trim() ? `/twojastara/entries?type=game&search=${encodeURIComponent(search.trim())}` : "/twojastara/entries?type=game"} className={`px-4 py-2 rounded-lg ${type === "game" ? "bg-amber-500 text-white" : "bg-white text-slate-600"}`}>
          Games
        </Link>
        <Link href={search?.trim() ? `/twojastara/entries?type=app&search=${encodeURIComponent(search.trim())}` : "/twojastara/entries?type=app"} className={`px-4 py-2 rounded-lg ${type === "app" ? "bg-amber-500 text-white" : "bg-white text-slate-600"}`}>
          Apps
        </Link>
      </div>

      <form method="get" className="mb-4">
        {type && <input type="hidden" name="type" value={type} />}
        <div className="flex gap-2">
          <input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by title or slug..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium">
            Search
          </button>
          {search?.trim() && (
            <Link
              href={type ? `/twojastara/entries?type=${type}` : "/twojastara/entries"}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium inline-flex items-center"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {entries.length > 0 ? (
        <EntryListWithGenerate entries={entries} />
      ) : (
        <p className="p-8 text-center text-slate-500 bg-white rounded-xl shadow">
          {search?.trim() ? "No entries match your search." : "No entries yet. Add your first game or app."}
        </p>
      )}
      <Pagination totalCount={totalCount} currentPage={currentPage} perPage={PER_PAGE} basePath="/twojastara/entries" queryParams={queryParams} />
    </div>
  );
}
