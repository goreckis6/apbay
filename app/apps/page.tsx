import SiteHeader from "@/app/components/SiteHeader";
import Footer from "@/app/components/Footer";
import EntryCard from "@/app/components/EntryCard";
import Pagination from "@/app/components/Pagination";
import CategoriesSidebar from "@/app/components/CategoriesSidebar";
import { prisma } from "@/lib/prisma";

const PER_PAGE = 60;

export const metadata = {
  title: "Apps - APKBAY",
  description: "Browse modded apps for Android",
};

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const skip = (currentPage - 1) * PER_PAGE;

  const [apps, totalCount, categories] = await Promise.all([
    prisma.entry.findMany({
      where: { type: "app", ...(category && { category: { slug: category } }) },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      skip,
      take: PER_PAGE,
    }),
    prisma.entry.count({ where: { type: "app", ...(category && { category: { slug: category } }) } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const gameCategories = categories.filter((c) => c.type === "game");
  const appCategories = categories.filter((c) => c.type === "app");

  const queryParams: Record<string, string> = {};
  if (category) queryParams.category = category;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Apps</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {apps.map((a) => (
                <EntryCard
                  key={a.id}
                  slug={a.slug}
                  title={a.title}
                  type="app"
                  version={a.version}
                  size={a.size}
                  modInfo={a.modInfo}
                  iconImage={a.iconImage}
                />
              ))}
            </div>
            {apps.length === 0 && (
              <p className="text-slate-500 text-center py-12">No apps yet. Add some from the admin panel.</p>
            )}
            <Pagination totalCount={totalCount} currentPage={currentPage} perPage={PER_PAGE} basePath="/apps" queryParams={queryParams} />
          </div>
          <CategoriesSidebar gameCategories={gameCategories} appCategories={appCategories} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
