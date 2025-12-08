import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";

// Public routes that don't require authentication (only landing page and auth pages)
const publicRoutes = ["/", "/sign-in", "/sign-up", "/sign-out"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log("[Middleware] Path:", pathname);
    console.log("[Middleware] Token exists:", !!token);
    if (token) {
      console.log("[Middleware] Token preview:", token.substring(0, 20) + "...");
    }
  }

  // Check if user is authenticated
  let isAuthenticated = false;
  if (token) {
    try {
      // jose requires the secret to be a Uint8Array or TextEncoder
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);
      isAuthenticated = true;
      if (process.env.NODE_ENV === "development") {
        console.log("[Middleware] Token verified, user authenticated");
      }
    } catch (error) {
      // Invalid token, treat as unauthenticated
      isAuthenticated = false;
      if (process.env.NODE_ENV === "development") {
        console.log("[Middleware] Token verification failed:", error);
      }
    }
  }

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

  // If user is authenticated and trying to access public routes, redirect to dashboard
  if (isAuthenticated && isPublicRoute) {
    // Allow access to sign-out
    if (pathname.startsWith("/sign-out")) {
      return NextResponse.next();
    }
    // Redirect authenticated users from root, sign-in, sign-up to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not authenticated and trying to access any route except public routes, redirect to root
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

