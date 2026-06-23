import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface CategoriesSidebarProps {
  gameCategories: Category[];
  appCategories: Category[];
}

export default function CategoriesSidebar({ gameCategories, appCategories }: CategoriesSidebarProps) {
  return (
    <aside className="lg:w-72 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
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
  );
}
