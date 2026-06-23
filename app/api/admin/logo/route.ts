import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getLogoUrl, saveLogoFile } from "@/lib/uploads";

export async function GET() {
  const url = await getLogoUrl();
  return NextResponse.json({ url });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveLogoFile(file.name, buffer);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
