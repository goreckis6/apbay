import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { deleteUploadedFile, listUploadedFiles, saveUploadedFile } from "@/lib/uploads";

export async function GET() {
  const files = await listUploadedFiles();
  return NextResponse.json(files);
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
    const url = await saveUploadedFile(file.name, buffer);
    return NextResponse.json({ success: true, url, name: file.name });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const name = request.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
  try {
    await deleteUploadedFile(name);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 400 }
    );
  }
}
