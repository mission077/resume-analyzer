import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await pool.query("SELECT 1"); // Simple query to test connection
    return NextResponse.json({
      status: "success",
      message: "Postgres connected!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}
