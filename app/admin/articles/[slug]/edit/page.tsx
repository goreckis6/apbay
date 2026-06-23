import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleForm from "../../new/ArticleForm";
import { prisma } from "@/lib/prisma";

export default async function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });

  if (!article) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/articles" className="text-amber-600 hover:underline">← Back</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Edit: {article.title}</h1>
      </div>
      <ArticleForm article={article} />
    </div>
  );
}
