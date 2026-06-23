import Link from "next/link";
import Image from "next/image";
import { formatSize } from "@/lib/formatSize";

interface EntryCardProps {
  slug: string;
  title: string;
  type: "game" | "app";
  version?: string | null;
  size?: string | null;
  modInfo?: string | null;
  iconImage?: string | null;
}

export default function EntryCard({ slug, title, type, version, size, modInfo, iconImage }: EntryCardProps) {
  const href = `/${type}s/${slug}`;
  const versionSize = [version, formatSize(size)].filter(Boolean).join(" + ");

  return (
    <Link href={href} className="block group">
      <article className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-[#EB144C]/30 hover:shadow-md transition">
        <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-slate-100 overflow-hidden">
          {iconImage ? (
            <Image src={iconImage} alt={title} width={56} height={56} className="w-full h-full object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">
              {type === "game" ? "🎮" : "📱"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 group-hover:text-[#EB144C] truncate text-sm leading-tight">{title}</h3>
          <div className="flex flex-col gap-1 mt-0.5 text-xs text-slate-500">
            {versionSize && (
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 w-3.5 h-3.5 text-slate-400" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </span>
                <span>{versionSize}</span>
              </div>
            )}
            {modInfo && (
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 w-3.5 h-3.5 text-slate-400" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </span>
                <span className="font-medium text-slate-600">{modInfo}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
