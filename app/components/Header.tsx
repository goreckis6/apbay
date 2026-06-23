"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function HeaderFallback() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16" />
    </header>
  );
}

function HeaderContent({ logoUrl }: { logoUrl?: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  const navLink = (href: string, label: string) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`font-medium transition ${
          isActive ? "text-[#EB144C] border-b-2 border-[#EB144C]" : "text-slate-700 hover:text-[#EB144C]"
        }`}
        onClick={() => setMenuOpen(false)}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="flex items-center shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="APKBAY" className="h-8 max-w-[180px] object-contain" />
              ) : (
                <span className="text-xl font-bold text-slate-900 tracking-tight">APKBAY.COM</span>
              )}
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {navLink("/", "Home")}
            {navLink("/apps", "Apps")}
            {navLink("/games", "Games")}
            {navLink("/articles", "News")}
            <Link href="/admin" className="text-slate-500 hover:text-[#EB144C] text-sm">Admin</Link>
          </nav>

          <div className="flex items-center">
            <form action="/search" method="get" className="relative">
              <input
                type="search"
                name="q"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 sm:w-48 pl-4 pr-10 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#EB144C]/30 focus:border-[#EB144C]"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#EB144C] transition" aria-label="Search">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {menuOpen && (
          <nav className="lg:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col gap-3">
              {navLink("/", "Home")}
              {navLink("/apps", "Apps")}
              {navLink("/games", "Games")}
              {navLink("/articles", "News")}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export default function Header({ logoUrl = null }: { logoUrl?: string | null }) {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <HeaderContent logoUrl={logoUrl} />
    </Suspense>
  );
}
