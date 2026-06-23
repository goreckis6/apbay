import Link from "next/link";
import EntryForm from "./EntryForm";
import { prisma } from "@/lib/prisma";

export default async function NewEntryPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="mb-8">
        <Link href="/twojastara/entries" className="text-amber-600 hover:underline">← Back</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Add New Game or App</h1>
      </div>
      <EntryForm categories={categories} />
    </div>
  );
}
