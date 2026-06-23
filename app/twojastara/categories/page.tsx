import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CategoryForm from "./CategoryForm";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { type: "asc" },
    include: { _count: { select: { entries: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Categories</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Add New Category</h2>
          <CategoryForm />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Existing Categories</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Entries</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 capitalize">{c.type}</td>
                    <td className="px-4 py-3">{c._count.entries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {categories.length === 0 && (
              <p className="p-8 text-center text-slate-500">No categories yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
