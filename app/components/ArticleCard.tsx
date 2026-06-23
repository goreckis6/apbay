import Link from "next/link";
import Image from "next/image";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt?: string | null;
  type: string;
  image?: string | null;
  publishedAt?: Date | null;
}

export default function ArticleCard({ slug, title, excerpt, type, image, publishedAt }: ArticleCardProps) {
  const href = `/articles/${slug}`;

  return (
    <Link href={href} className="block group">
      <article className="rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-[#EB144C]/30 hover:shadow-sm transition">
        <div className="aspect-video bg-slate-100 overflow-hidden">
          {image ? (
            <Image src={image} alt={title} width={400} height={225} className="w-full h-full object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">📰</div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-slate-800 group-hover:text-[#EB144C] text-sm line-clamp-2">{title}</h3>
        </div>
      </article>
    </Link>
  );
}
