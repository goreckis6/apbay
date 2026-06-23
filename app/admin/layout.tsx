import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 w-64 h-full bg-slate-900 text-white">
        <div className="p-6">
          <Link href="/admin" className="text-xl font-bold">Admin Panel</Link>
        </div>
        <nav className="mt-4">
          <Link href="/admin" className="block px-6 py-3 hover:bg-slate-800">Dashboard</Link>
          <Link href="/admin/entries" className="block px-6 py-3 hover:bg-slate-800">Games & Apps</Link>
          <Link href="/admin/articles" className="block px-6 py-3 hover:bg-slate-800">Articles</Link>
          <Link href="/admin/categories" className="block px-6 py-3 hover:bg-slate-800">Categories</Link>
          <Link href="/" className="block px-6 py-3 hover:bg-slate-800 text-amber-400">← View Site</Link>
        </nav>
      </aside>
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
