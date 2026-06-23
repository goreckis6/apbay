import Link from "next/link";
import SiteHeader from "./components/SiteHeader";
import Footer from "./components/Footer";
import EntryCard from "./components/EntryCard";
import ArticleCard from "./components/ArticleCard";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [games, apps, articles, categories] = await Promise.all([
    prisma.entry.findMany({ where: { type: "game" }, include: { category: true }, orderBy: { publishedAt: "desc" }, take: 12 }),
    prisma.entry.findMany({ where: { type: "app" }, include: { category: true }, orderBy: { publishedAt: "desc" }, take: 12 }),
    prisma.article.findMany({ orderBy: { publishedAt: "desc" }, take: 6 }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const gameCategories = categories.filter((c) => c.type === "game");
  const appCategories = categories.filter((c) => c.type === "app");

  const essentialApps = apps.slice(0, 6);
  const editorChoice = [...games.slice(0, 3), ...apps.slice(6, 9)].slice(0, 6);
  const gamesLatest = games.slice(0, 6);
  const appsLatest = apps.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* News */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">News</h2>
                <Link href="/articles" className="px-3 py-1.5 text-white text-sm font-medium rounded transition hover:opacity-90" style={{ backgroundColor: "#EB144C" }}>
                  View More
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.slice(0, 3).map((a) => (
                  <ArticleCard key={a.id} slug={a.slug} title={a.title} excerpt={a.excerpt} type={a.type} image={a.image} publishedAt={a.publishedAt} />
                ))}
              </div>
            </section>

            {/* Essential Apps */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Essential Apps</h2>
                <Link href="/apps" className="px-3 py-1.5 text-white text-sm font-medium rounded transition hover:opacity-90" style={{ backgroundColor: "#EB144C" }}>
                  View More
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {essentialApps.map((a) => (
                  <EntryCard key={a.id} slug={a.slug} title={a.title} type="app" version={a.version} size={a.size} modInfo={a.modInfo} iconImage={a.iconImage} />
                ))}
              </div>
              {essentialApps.length === 0 && (
                <p className="text-slate-500 text-sm py-4">No apps yet. Add some from the admin panel.</p>
              )}
            </section>

            {/* Editor's Choice */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Editor&apos;s Choice</h2>
                <Link href="/games" className="px-3 py-1.5 text-white text-sm font-medium rounded transition hover:opacity-90" style={{ backgroundColor: "#EB144C" }}>
                  View More
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {editorChoice.map((e) => (
                  <EntryCard key={e.id} slug={e.slug} title={e.title} type={e.type as "game" | "app"} version={e.version} size={e.size} modInfo={e.modInfo} iconImage={e.iconImage} />
                ))}
              </div>
              {editorChoice.length === 0 && (
                <p className="text-slate-500 text-sm py-4">No entries yet.</p>
              )}
            </section>

            {/* Games Mod - Latest */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Games Mod - Latest</h2>
                <Link href="/games" className="px-3 py-1.5 text-white text-sm font-medium rounded transition hover:opacity-90" style={{ backgroundColor: "#EB144C" }}>
                  View More
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {gamesLatest.map((g) => (
                  <EntryCard key={g.id} slug={g.slug} title={g.title} type="game" version={g.version} size={g.size} modInfo={g.modInfo} iconImage={g.iconImage} />
                ))}
              </div>
            </section>

            {/* Premium Apps - Latest */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Premium Apps - Latest</h2>
                <Link href="/apps" className="px-3 py-1.5 text-white text-sm font-medium rounded transition hover:opacity-90" style={{ backgroundColor: "#EB144C" }}>
                  View More
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {appsLatest.map((a) => (
                  <EntryCard key={a.id} slug={a.slug} title={a.title} type="app" version={a.version} size={a.size} modInfo={a.modInfo} iconImage={a.iconImage} />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Games categories */}
              <section className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Games</h2>
                  <Link href="/games" className="px-3 py-1.5 text-white text-sm font-medium rounded transition hover:opacity-90" style={{ backgroundColor: "#EB144C" }}>
                    View More
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {gameCategories.map((c) => (
                    <Link key={c.id} href={`/games?category=${c.slug}`} className="text-sm text-blue-600 hover:text-[#EB144C] hover:underline">
                      {c.name}
                    </Link>
                  ))}
                </div>
                {gameCategories.length === 0 && <p className="text-slate-500 text-sm">No categories</p>}
              </section>

              {/* Apps categories */}
              <section className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Apps</h2>
                  <Link href="/apps" className="px-3 py-1.5 text-white text-sm font-medium rounded transition hover:opacity-90" style={{ backgroundColor: "#EB144C" }}>
                    View More
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {appCategories.map((c) => (
                    <Link key={c.id} href={`/apps?category=${c.slug}`} className="text-sm text-blue-600 hover:text-[#EB144C] hover:underline">
                      {c.name}
                    </Link>
                  ))}
                </div>
                {appCategories.length === 0 && <p className="text-slate-500 text-sm">No categories</p>}
              </section>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
