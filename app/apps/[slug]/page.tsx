import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EntryDetailPage from "@/app/components/EntryDetailPage";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await prisma.entry.findUnique({ where: { slug } });
  if (!entry) return { title: "Not Found" };
  const url = `/apps/${slug}`;
  const image = entry.bannerImage || entry.iconImage;
  return {
    title: entry.title,
    description: entry.description || undefined,
    alternates: { canonical: url },
    openGraph: {
      title: entry.title,
      description: entry.description || undefined,
      url,
      type: "website",
      ...(image && { images: [{ url: image, width: 1200, height: 630, alt: entry.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.description || undefined,
      ...(image && { images: [image] }),
    },
  };
}

export default async function AppPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await prisma.entry.findUnique({
    where: { slug, type: "app" },
    include: { category: true },
  });

  if (!entry) notFound();

  const [relatedEntries, recommendedCandidates] = await Promise.all([
    prisma.entry.findMany({
      where: { type: "app", ...(entry.publisher && { publisher: entry.publisher }), id: { not: entry.id } },
      include: { category: true },
      take: 4 },
    ),
    prisma.entry.findMany({
      where: { type: "app", id: { not: entry.id } },
      include: { category: true },
      take: 50 },
    ),
  ]);

  const recommendedEntries = recommendedCandidates.sort(() => Math.random() - 0.5).slice(0, 12);

  return <EntryDetailPage entry={entry} relatedEntries={relatedEntries} recommendedEntries={recommendedEntries} />;
}
