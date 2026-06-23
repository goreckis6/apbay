import Link from "next/link";
import ArticleForm from "./ArticleForm";

export default function NewArticlePage() {
  return (
    <div>
      <div className="mb-8">
        <Link href="/twojastara/articles" className="text-amber-600 hover:underline">← Back</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Add New Article</h1>
      </div>
      <ArticleForm />
    </div>
  );
}
