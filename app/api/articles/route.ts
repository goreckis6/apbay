import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "article" | "news" | null;
  const limit = parseInt(searchParams.get("limit") || "10");

  const where = type ? { type } : {};
  const articles = await prisma.article.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const article = await prisma.article.create({
      data: {
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt,
        content: body.content,
        image: body.image,
        type: body.type || "article",
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
      },
    });
    return NextResponse.json(article);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
