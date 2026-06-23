import Link from "next/link";

interface PaginationProps {
  totalCount: number;
  currentPage: number;
  perPage: number;
  basePath: string;
  queryParams?: Record<string, string>;
}

export default function Pagination({
  totalCount,
  currentPage,
  perPage,
  basePath,
  queryParams = {},
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / perPage) || 1;
  if (totalPages <= 1) return null;

  const qs = (p: number) => {
    const params = new URLSearchParams(queryParams);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  const showPages = 5;
  let start = Math.max(1, currentPage - Math.floor(showPages / 2));
  let end = Math.min(totalPages, start + showPages - 1);
  if (end - start + 1 < showPages) start = Math.max(1, end - showPages + 1);

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
      {currentPage > 1 ? (
        <Link
          href={`${basePath}${qs(currentPage - 1)}`}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-sm font-medium"
        >
          ← Prev
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-sm font-medium cursor-not-allowed">
          ← Prev
        </span>
      )}
      <div className="flex gap-1">
        {start > 1 && (
          <>
            <Link href={`${basePath}${qs(1)}`} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium">
              1
            </Link>
            {start > 2 && <span className="px-2 py-2 text-slate-400">…</span>}
          </>
        )}
        {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) =>
          p === currentPage ? (
            <span key={p} className="px-3 py-2 rounded-lg bg-[#EB144C] text-white border border-[#EB144C] text-sm font-medium">
              {p}
            </span>
          ) : (
            <Link key={p} href={`${basePath}${qs(p)}`} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium">
              {p}
            </Link>
          )
        )}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-2 py-2 text-slate-400">…</span>}
            <Link href={`${basePath}${qs(totalPages)}`} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium">
              {totalPages}
            </Link>
          </>
        )}
      </div>
      {currentPage < totalPages ? (
        <Link
          href={`${basePath}${qs(currentPage + 1)}`}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-sm font-medium"
        >
          Next →
        </Link>
      ) : (
        <span className="px-3 py-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-sm font-medium cursor-not-allowed">
          Next →
        </span>
      )}
    </nav>
  );
}
