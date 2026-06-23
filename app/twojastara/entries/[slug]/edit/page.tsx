import Link from "next/link";
import { notFound } from "next/navigation";
import EntryForm from "../../new/EntryForm";
import { prisma } from "@/lib/prisma";

export default async function EditEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [entry, categories] = await Promise.all([
    prisma.entry.findUnique({ where: { slug } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!entry) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link href="/twojastara/entries" className="text-amber-600 hover:underline">← Back</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Edit: {entry.title}</h1>
      </div>
      <EntryForm categories={categories} entry={entry} />
    </div>
  );
}
