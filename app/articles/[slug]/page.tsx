import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
import Footer from "@/app/components/Footer";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return { title: "Not Found" };
  const url = `/articles/${slug}`;
  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      url,
      type: "article",
      ...(article.image && { images: [{ url: article.image, width: 1200, height: 630, alt: article.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || undefined,
      ...(article.image && { images: [article.image] }),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });

  if (!article) notFound();

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-slate-600 mb-6">
          <Link href="/" className="hover:text-red-600">Home</Link>
          {" > "}
          <Link href="/articles" className="hover:text-red-600">Changelog</Link>
          {" > "}
          <span className="text-slate-800">{article.title}</span>
        </nav>

        <article>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{article.title}</h1>
          {publishedDate && <p className="text-sm text-slate-500 mb-6">{publishedDate}</p>}
          {article.excerpt && <p className="text-lg text-slate-600 mb-6">{article.excerpt}</p>}
          {article.content && (
            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap text-slate-700">{article.content}</p>
            </div>
          )}
        </article>

        <Link href="/articles" className="inline-block mt-8 text-red-600 hover:text-amber-700 font-medium">
          ← Back to Changelog
        </Link>
      </main>
      <Footer />
    </div>
  );
}
