import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const entry = await prisma.entry.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const body = await request.json();
    const entry = await prisma.entry.update({
      where: { slug },
      data: {
        ...(body.slug && { slug: body.slug }),
        ...(body.title && { title: body.title }),
        ...(body.type && { type: body.type }),
        ...(body.tagline !== undefined && { tagline: body.tagline }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.publisher !== undefined && { publisher: body.publisher }),
        ...(body.size !== undefined && { size: body.size }),
        ...(body.version !== undefined && { version: body.version }),
        ...(body.modInfo !== undefined && { modInfo: body.modInfo }),
        ...(body.bannerImage !== undefined && { bannerImage: body.bannerImage }),
        ...(body.iconImage !== undefined && { iconImage: body.iconImage }),
        ...(body.screenshots !== undefined && { screenshots: typeof body.screenshots === "string" ? body.screenshots : JSON.stringify(body.screenshots) }),
        ...(body.heroTitle !== undefined && { heroTitle: body.heroTitle }),
        ...(body.heroSubtitle !== undefined && { heroSubtitle: body.heroSubtitle }),
        ...(body.screenshotImage !== undefined && { screenshotImage: body.screenshotImage }),
        ...(body.modFeatures !== undefined && { modFeatures: body.modFeatures }),
        ...(body.downloadNotes !== undefined && { downloadNotes: body.downloadNotes }),
        ...(body.downloadUrl !== undefined && { downloadUrl: body.downloadUrl || null }),
        ...(body.downloadVersions !== undefined && { downloadVersions: body.downloadVersions || null }),
        ...(body.contentBlocks !== undefined && { contentBlocks: typeof body.contentBlocks === "string" ? body.contentBlocks : JSON.stringify(body.contentBlocks) }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
        ...(body.publishedAt !== undefined && { publishedAt: body.publishedAt ? new Date(body.publishedAt) : null }),
      },
    });
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Entry update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    await prisma.entry.delete({ where: { slug } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
