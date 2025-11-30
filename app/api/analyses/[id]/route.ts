import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET - Fetch single analysis by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ FIXED: Await cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const { id: analysisId } = await context.params;

    // Fetch specific analysis from database
    const result = await db.query(
      `
      SELECT 
        id,
        file_name,
        company_name,
        job_title,
        job_description,
        resume_text,
        overall_score,
        ats_score,
        strengths,
        gaps,
        recommendations,
        created_at
      FROM resume_analyses
      WHERE id = $1 AND user_id = $2
    `,
      [analysisId, decoded.userId]
    );

    // Check if analysis exists and belongs to user
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    console.log(
      `✅ Fetched analysis #${analysisId} for user ${decoded.userId}`
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}
