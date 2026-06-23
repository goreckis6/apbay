import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatSize } from "@/lib/formatSize";
import SiteHeader from "@/app/components/SiteHeader";
import Footer from "@/app/components/Footer";
import EntryCard from "@/app/components/EntryCard";
import { prisma } from "@/lib/prisma";

type DownloadVersion = { version: string; size: string; url: string };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await prisma.entry.findUnique({ where: { slug } });
  if (!entry) return { title: "Not Found" };
  return {
    title: `Download: ${entry.title}`,
    description: entry.description || undefined,
  };
}

function parseDownloadVersions(json: string | null): DownloadVersion[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default async function DownloadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await prisma.entry.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!entry) notFound();

  const typeLabel = entry.type === "game" ? "Games" : "Apps";
  const typePath = entry.type === "game" ? "games" : "apps";
  const appName = entry.title.split("(")[0].trim();

  const publishedDate = entry.publishedAt
    ? new Date(entry.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const downloadVersions = parseDownloadVersions(entry.downloadVersions);
  const hasVersions = downloadVersions.length > 0;
  const fallbackVersion: DownloadVersion | null =
    entry.downloadUrl && (entry.version || entry.size)
      ? {
          version: entry.version || "Latest",
          size: entry.size || "APK",
          url: entry.downloadUrl,
        }
      : entry.downloadUrl
        ? { version: "Latest", size: entry.size || "APK", url: entry.downloadUrl }
        : null;

  const versionsToShow = hasVersions ? downloadVersions : fallbackVersion ? [fallbackVersion] : [];

  const [relatedEntries, recommendedEntries] = await Promise.all([
    prisma.entry.findMany({
      where: { type: entry.type, ...(entry.publisher && { publisher: entry.publisher }), id: { not: entry.id } },
      include: { category: true },
      take: 2,
    }),
    prisma.entry.findMany({
      where: { type: entry.type, id: { not: entry.id }, ...(entry.categoryId && { categoryId: entry.categoryId }) },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
  ]);

  const isExternalUrl = (url: string) => url.startsWith("http");

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Breadcrumb: Home > Apps > Productivity > App > Download */}
        <nav className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#EB144C]">Home</Link>
          {" > "}
          <Link href={`/${typePath}`} className="hover:text-[#EB144C]">{typeLabel}</Link>
          {entry.category && (
            <>
              {" > "}
              <Link href={`/${typePath}?category=${entry.category.slug}`} className="hover:text-[#EB144C]">
                {entry.category.name}
              </Link>
            </>
          )}
          {" > "}
          <Link href={`/${typePath}/${slug}`} className="hover:text-[#EB144C]">
            {appName}
          </Link>
          {" > "}
          <span className="text-slate-800 font-medium">Download</span>
        </nav>

        {/* MODYOLO-style: App icon + title row */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4">
          {entry.iconImage && (
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-slate-200">
              <Image
                src={entry.iconImage}
                alt={appName}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
              Download: {entry.title}
            </h1>
            {publishedDate && (
              <p className="text-sm text-slate-500 mt-0.5 italic">
                {publishedDate}
              </p>
            )}
          </div>
        </div>

        {/* Version cards - MODYOLO style: red header bar + light grey download button */}
        <div className="space-y-4 mb-6 sm:mb-8">
          {versionsToShow.map((v, i) => (
            <div
              key={i}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              <div className="text-white font-semibold py-2.5 px-4 text-sm sm:text-base" style={{ backgroundColor: "#EB144C" }}>
                {v.version} - {entry.modInfo || "Mod"}
              </div>
              <div className="p-0">
                <a
                  href={v.url}
                  target={isExternalUrl(v.url) ? "_blank" : undefined}
                  rel={isExternalUrl(v.url) ? "noopener noreferrer" : undefined}
                  className="flex items-center w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 border-t border-slate-200 transition text-left"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-5 h-5 text-slate-700 flex-shrink-0 mr-3"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span className="font-semibold text-slate-800 flex-1">DOWNLOAD APK</span>
                  <span className="text-slate-500 text-sm">{formatSize(v.size)}</span>
                </a>
              </div>
            </div>
          ))}
          {versionsToShow.length === 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="text-white font-semibold py-2.5 px-4" style={{ backgroundColor: "#EB144C" }}>Download</div>
              <div className="p-4 bg-slate-100 border-t border-slate-200">
                <span className="text-slate-500">Download not configured. Add Download URL in admin panel.</span>
              </div>
            </div>
          )}
        </div>

        {/* Download Notes - MODYOLO style: italic intro + bullet list */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-600 mb-3 italic">
            You are now ready to download <strong>{appName}</strong> for free. Here are some notes:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 italic">
            {entry.downloadNotes ? (
              entry.downloadNotes.split("\n").map((note, i) => (
                <li key={i}>{note.trim()}</li>
              ))
            ) : (
              <>
                <li>Please read our MOD Info and installation instructions carefully for the game & app to work properly</li>
                <li>Downloading via 3rd party software like IDM, ADM (Direct link) is currently blocked for abuse reasons.</li>
              </>
            )}
          </ul>
        </div>

        {/* Recommended for You - MODYOLO style */}
        {recommendedEntries.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Recommended for You</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendedEntries.map((e) => (
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
          </section>
        )}

        {/* Back to app page */}
        <Link
          href={`/${typePath}/${slug}`}
          className="inline-flex items-center gap-2 mt-8 py-3 px-5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 hover:text-[#EB144C] transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to {appName}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
