import SiteHeader from "@/app/components/SiteHeader";
import Footer from "@/app/components/Footer";
import EntryCard from "@/app/components/EntryCard";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Search - APKBAY",
  description: "Search games and apps",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || "").trim();

  let entries: Awaited<ReturnType<typeof prisma.entry.findMany>> = [];
  if (query.length > 0) {
    // Split into words and require ALL words to match (e.g. "castle dragon" only finds entries with both)
    const words = query.split(/\s+/).filter((w) => w.length > 0);
    const wordConditions = words.map((word) => ({
      OR: [
        { title: { contains: word } },
        { tagline: { contains: word } },
        { description: { contains: word } },
        { slug: { contains: word } },
      ],
    }));
    entries = await prisma.entry.findMany({
      where: {
        AND: wordConditions,
      },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: 60,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">
          {query ? `Search results for "${query}"` : "Search"}
        </h1>
        {!query ? (
          <p className="text-slate-500">Enter a search term above to find games and apps.</p>
        ) : entries.length === 0 ? (
          <p className="text-slate-500">No results found for "{query}".</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.map((e) => (
              <EntryCard
                key={e.id}
                slug={e.slug}
                title={e.title}
                type={e.type as "game" | "app"}
                version={e.version}
                size={e.size}
                modInfo={e.modInfo}
                iconImage={e.iconImage}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
