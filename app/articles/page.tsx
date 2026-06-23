import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ArticleCard from "@/app/components/ArticleCard";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "News - APKBAY",
  description: "Latest articles and news",
};

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">News</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a) => (
            <ArticleCard key={a.id} slug={a.slug} title={a.title} excerpt={a.excerpt} type={a.type} publishedAt={a.publishedAt} />
          ))}
        </div>
        {articles.length === 0 && (
          <p className="text-slate-500 text-center py-12">No articles yet. Add some from the admin panel.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
