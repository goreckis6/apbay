"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_BASE, ADMIN_LOGIN } from "@/lib/adminPath";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === ADMIN_LOGIN) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push(ADMIN_LOGIN);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 w-64 h-full bg-slate-900 text-white">
        <div className="p-6">
          <Link href={ADMIN_BASE} className="text-xl font-bold">
            Admin Panel
          </Link>
        </div>
        <nav className="mt-4">
          <Link href={ADMIN_BASE} className="block px-6 py-3 hover:bg-slate-800">
            Dashboard
          </Link>
          <Link href={`${ADMIN_BASE}/entries`} className="block px-6 py-3 hover:bg-slate-800">
            Games & Apps
          </Link>
          <Link href={`${ADMIN_BASE}/articles`} className="block px-6 py-3 hover:bg-slate-800">
            Articles
          </Link>
          <Link href={`${ADMIN_BASE}/categories`} className="block px-6 py-3 hover:bg-slate-800">
            Categories
          </Link>
          <Link href={`${ADMIN_BASE}/files`} className="block px-6 py-3 hover:bg-slate-800">
            Files
          </Link>
          <Link href="/" className="block px-6 py-3 hover:bg-slate-800 text-amber-400">
            ← View Site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full text-left px-6 py-3 hover:bg-slate-800 text-red-300"
          >
            Logout
          </button>
        </nav>
      </aside>
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
