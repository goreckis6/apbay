import Link from "next/link";
import Image from "next/image";
import { formatSize } from "@/lib/formatSize";
import Header from "./Header";
import Footer from "./Footer";
import EntryCard from "./EntryCard";
import { parseContentBlocks } from "@/lib/contentBlocks";
import type { Prisma } from "@prisma/client";

type EntryWithCategory = Prisma.EntryGetPayload<{
  include: { category: true };
}>;

interface EntryDetailPageProps {
  entry: EntryWithCategory;
  relatedEntries: EntryWithCategory[];
  recommendedEntries: EntryWithCategory[];
}

export default function EntryDetailPage({ entry, relatedEntries, recommendedEntries }: EntryDetailPageProps) {
  const typeLabel = entry.type === "game" ? "Games" : "Apps";
  const typePath = entry.type === "game" ? "games" : "apps";

  const publishedDate = entry.publishedAt
    ? new Date(entry.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const modFeaturesList = entry.modFeatures
    ? entry.modFeatures.split("\n").filter((line) => line.trim())
    : [];

  const contentBlocks = parseContentBlocks(entry.contentBlocks);

  const DownloadButton = () => (
    <Link
      href={`/download/${entry.slug}`}
      className="block w-full py-3.5 sm:py-4 px-4 sm:px-6 text-white font-bold rounded-lg sm:rounded-xl transition text-center text-sm sm:text-base touch-manipulation hover:opacity-90"
      style={{ backgroundColor: "#EB144C" }}
    >
      Download ({formatSize(entry.size) || "APK"})
    </Link>
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const pageUrl = `${baseUrl}/${typePath}/${entry.slug}`;
  const img = entry.bannerImage || entry.iconImage;
  const imageUrl = img ? (img.startsWith("http") ? img : `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`) : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": entry.type === "game" ? "VideoGame" : "SoftwareApplication",
    name: entry.title.split("(")[0].trim(),
    url: pageUrl,
    applicationCategory: entry.type === "game" ? "Game" : "UtilitiesApplication",
    operatingSystem: "Android",
    description: entry.description,
    ...(imageUrl && { image: imageUrl }),
    ...(entry.publisher && { author: { "@type": "Organization", name: entry.publisher } }),
    ...(entry.version && { softwareVersion: entry.version }),
    ...(entry.size && { fileSize: formatSize(entry.size) }),
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#EB144C]">Home</Link>
          {" > "}
          <Link href={`/${typePath}`} className="hover:text-[#EB144C]">{typeLabel}</Link>
          {entry.category && (
            <>
              {" > "}
              <Link href={`/${typePath}?category=${entry.category.slug}`} className="hover:text-[#EB144C]">{entry.category.name}</Link>
            </>
          )}
          {" > "}
          <span className="text-slate-800">{entry.slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</span>
        </nav>

        {/* Hero Banner - image only */}
        {entry.bannerImage && (
          <div className="rounded-lg sm:rounded-xl overflow-hidden mb-4 sm:mb-6 -mx-1 sm:mx-0">
            <Image src={entry.bannerImage} alt={entry.title} width={1200} height={400} className="w-full h-auto object-cover min-h-[140px] sm:min-h-[200px]" unoptimized />
          </div>
        )}

        {/* App/Game Info Section - avatar left, title right (MODYOLO style) */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-row gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-200">
              {entry.iconImage ? (
                <Image src={entry.iconImage} alt={entry.title} width={80} height={80} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  {entry.type === "game" ? "🎮" : "📱"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 leading-tight">{entry.title}</h1>
              {publishedDate && <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{publishedDate}</p>}
            </div>
          </div>
          {entry.description && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-100/80 border border-slate-200 rounded-lg w-full">
              <p className="text-slate-700 text-sm italic">{entry.description}</p>
            </div>
          )}
        </div>

        {/* Metadata Table - MODYOLO style: icon + label left, value right */}
        <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 overflow-x-auto mb-4 sm:mb-6">
          <table className="w-full min-w-[280px]">
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 align-top w-32 sm:w-44 md:w-48">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 text-red-500" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    </span>
                    <span className="text-slate-500 text-sm font-medium">App Name</span>
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-800 font-medium text-sm sm:text-base">{entry.title.split("(")[0].trim()}</td>
              </tr>
              {entry.publisher && (
                <tr>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 align-top">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-5 h-5 text-red-500" aria-hidden>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M9 8h1"/><path d="M9 12h1"/><path d="M9 16h1"/><path d="M14 8h1"/><path d="M14 12h1"/><path d="M14 16h1"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>
                      </span>
                      <span className="text-slate-500 text-sm font-medium">Publisher</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-800 text-sm sm:text-base">{entry.publisher}</td>
                </tr>
              )}
              {entry.category && (
                <tr>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 align-top">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-5 h-5 text-red-500" aria-hidden>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                      </span>
                      <span className="text-slate-500 text-sm font-medium">Genre</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                    <Link href={`/${typePath}?category=${entry.category.slug}`} className="text-[#EB144C] hover:underline font-medium text-sm sm:text-base">
                      {entry.category.name}
                    </Link>
                  </td>
                </tr>
              )}
              {entry.size && (
                <tr>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 align-top">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-5 h-5 text-red-500" aria-hidden>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                      </span>
                      <span className="text-slate-500 text-sm font-medium">Size</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-800 text-sm sm:text-base">{formatSize(entry.size)}</td>
                </tr>
              )}
              {entry.version && (
                <tr>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 align-top">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-5 h-5 text-red-500" aria-hidden>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </span>
                      <span className="text-slate-500 text-sm font-medium">Latest Version</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-800 text-sm sm:text-base">{entry.version}</td>
                </tr>
              )}
              {entry.modInfo && (
                <tr>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 align-top">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-5 h-5 text-red-500" aria-hidden>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </span>
                      <span className="text-slate-500 text-sm font-medium">MOD Info</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-[#EB144C] font-medium text-sm sm:text-base">{entry.modInfo}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOD Info Section - Bullet list */}
        {modFeaturesList.length > 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-3 sm:p-4 mb-4 sm:mb-6">
            <h3 className="font-bold text-slate-800 mb-3">MOD Info</h3>
            <ul className="space-y-2">
              {modFeaturesList.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-700">
                  <span className="text-red-500">•</span>
                  {feature.trim()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Download Button */}
        <div className="mb-6 sm:mb-8">
          <DownloadButton />
        </div>

        {/* Main Content - Legacy content */}
        {entry.content && contentBlocks.length === 0 && (
          <div className="prose prose-slate max-w-none mb-8">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">{entry.content}</div>
          </div>
        )}

        {/* Content Blocks */}
        {contentBlocks.length > 0 && (
          <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
            {contentBlocks.map((block, i) => (
              <div key={i}>
                {block.type === "text" && (
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{block.content}</div>
                )}
                {block.type === "h1" && (
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">{block.content}</h1>
                )}
                {block.type === "h2" && (
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3 mt-4 sm:mt-6">{block.content}</h2>
                )}
                {block.type === "image" && (
                  <div className="w-full rounded-lg sm:rounded-xl overflow-hidden -mx-1 sm:mx-0">
                    <Image src={block.url} alt={block.alt || entry.title} width={800} height={450} className="w-full h-auto object-cover" unoptimized />
                  </div>
                )}
                {block.type === "two-columns" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      {block.left.type === "text" ? (
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{block.left.content}</div>
                      ) : (
                        <div className="rounded-xl overflow-hidden">
                          <Image src={block.left.url} alt={block.left.alt || ""} width={400} height={300} className="w-full h-auto object-cover" unoptimized />
                        </div>
                      )}
                    </div>
                    <div>
                      {block.right.type === "text" ? (
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{block.right.content}</div>
                      ) : (
                        <div className="rounded-xl overflow-hidden">
                          <Image src={block.right.url} alt={block.right.alt || ""} width={400} height={300} className="w-full h-auto object-cover" unoptimized />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Download Section */}
        <div id="download" className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">{entry.title.split("(")[0].trim()} Download</h2>
          <DownloadButton />
          <p className="text-sm text-slate-600 mt-4">
            You are now ready to download {entry.title.split("(")[0].trim()} for free. Here are some notes:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
            {entry.downloadNotes ? (
              entry.downloadNotes.split("\n").map((note, i) => (
                <li key={i}>{note.trim()}</li>
              ))
            ) : (
              <li>Please read our MOD Info and installation instructions carefully for the game & app to work properly</li>
            )}
          </ul>
        </div>

        {/* More from Developer */}
        {relatedEntries.length > 0 && (
          <section className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">More from Developer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {relatedEntries.slice(0, 2).map((e) => (
                <EntryCard key={e.id} slug={e.slug} title={e.title} type={e.type as "game" | "app"} version={e.version} size={e.size} modInfo={e.modInfo} iconImage={e.iconImage} />
              ))}
            </div>
          </section>
        )}

        {/* Recommended for You */}
        {recommendedEntries.length > 0 && (
          <section className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">Recommended for You</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {recommendedEntries.map((e) => (
                <EntryCard key={e.id} slug={e.slug} title={e.title} type={e.type as "game" | "app"} version={e.version} size={e.size} modInfo={e.modInfo} iconImage={e.iconImage} />
              ))}
            </div>
          </section>
        )}

        {/* Back link */}
        <Link
          href={`/${typePath}`}
          className="inline-flex items-center justify-center gap-2 mt-6 sm:mt-8 py-2.5 sm:py-3 px-4 sm:px-5 w-full sm:w-auto bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 hover:text-[#EB144C] transition text-sm sm:text-base touch-manipulation"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to {typeLabel}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
