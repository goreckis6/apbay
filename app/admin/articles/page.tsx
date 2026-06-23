import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteArticleButton from "./DeleteArticleButton";
export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Articles</h1>
        <Link href="/admin/articles/new" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium">
          Add New
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Type</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3 capitalize">{a.type}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/articles/${a.slug}`} className="text-amber-600 hover:underline mr-3">View</Link>
                  <Link href={`/admin/articles/${a.slug}/edit`} className="text-amber-600 hover:underline">Edit</Link>
                  <DeleteArticleButton slug={a.slug} title={a.title} />
                </td>              </tr>
            ))}
          </tbody>
        </table>
        {articles.length === 0 && (
          <p className="p-8 text-center text-slate-500">No articles yet.</p>
        )}
      </div>
    </div>
  );
}
