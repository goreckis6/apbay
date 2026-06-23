import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "game" | "app" | null;
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "12");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (category) where.categoryId = category;

  const entries = await prisma.entry.findMany({
    where,
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = await prisma.entry.create({
      data: {
        slug: body.slug,
        title: body.title,
        type: body.type,
        tagline: body.tagline,
        description: body.description,
        content: body.content,
        publisher: body.publisher,
        size: body.size,
        version: body.version,
        modInfo: body.modInfo,
        bannerImage: body.bannerImage,
        iconImage: body.iconImage,
        screenshots: body.screenshots ? JSON.stringify(body.screenshots) : null,
        heroTitle: body.heroTitle || null,
        heroSubtitle: body.heroSubtitle || null,
        screenshotImage: body.screenshotImage || null,
        modFeatures: body.modFeatures || null,
        downloadNotes: body.downloadNotes || null,
        downloadUrl: body.downloadUrl || null,
        downloadVersions: body.downloadVersions || null,
        contentBlocks: body.contentBlocks ? (typeof body.contentBlocks === "string" ? body.contentBlocks : JSON.stringify(body.contentBlocks)) : null,
        categoryId: body.categoryId || null,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
      },
    });
    return NextResponse.json(entry);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
