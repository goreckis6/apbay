import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, verifyAdminLogin } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!verifyAdminLogin(String(username || ""), String(password || ""))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", await createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
