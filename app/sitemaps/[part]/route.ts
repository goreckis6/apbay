import { getSitemapChunk } from "@/lib/sitemapData";
import { buildUrlsetXml } from "@/lib/sitemapXml";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ part: string }> }
) {
  const partNum = Number.parseInt((await params).part, 10);
  if (!Number.isFinite(partNum) || partNum < 1) {
    return new Response("Not found", { status: 404 });
  }

  const chunk = await getSitemapChunk(partNum);
  if (!chunk) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(buildUrlsetXml(chunk), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
