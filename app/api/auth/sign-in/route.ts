import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-key-change-in-production";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      console.log("[Sign-in API] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("[Sign-in API] Attempting login for:", email);

    // Find user in PostgreSQL
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      console.log("[Sign-in API] User not found:", email);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      console.log("[Sign-in API] Invalid password for:", email);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last_signed_in timestamp in PostgreSQL
    await pool.query("UPDATE users SET last_signed_in = NOW() WHERE id = $1", [
      user.id,
    ]);

    // Create JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("[Sign-in API] Login successful for:", email, "Redirecting to dashboard");

    // Create redirect response to dashboard with cookie set
    const redirectUrl = new URL("/dashboard", req.url);
    const response = NextResponse.redirect(redirectUrl);

    // Set cookie in the redirect response
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("[Sign-in API] Cookie set, returning 307 redirect");
    return response;
  } catch (err: any) {
    console.error("[Sign-in API] Login error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
