import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // Create redirect response to landing page with cookie cleared
  const redirectUrl = new URL("/", req.url);
  const response = NextResponse.redirect(redirectUrl);

  // Delete the authentication cookie by setting it to empty with immediate expiration
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return response;
}
