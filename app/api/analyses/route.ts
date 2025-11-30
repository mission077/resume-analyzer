import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// POST - Save new analysis to database
export async function POST(request: NextRequest) {
  try {
    // ✅ FIXED: Await cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    const body = await request.json();
    const {
      fileName,
      companyName,
      jobTitle,
      jobDescription,
      resumeText,
      analysis,
    } = body;

    // Validate required fields
    if (
      !fileName ||
      !companyName ||
      !jobTitle ||
      !jobDescription ||
      !resumeText ||
      !analysis
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert into database
    const result = await db.query(
      `
      INSERT INTO resume_analyses (
        user_id,
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
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'completed')
      RETURNING id
    `,
      [
        decoded.userId,
        fileName,
        companyName,
        jobTitle,
        jobDescription,
        resumeText,
        analysis.overallScore || null,
        analysis.atsScore || null,
        JSON.stringify(analysis.strengths || []),
        JSON.stringify(analysis.gaps || []),
        JSON.stringify(analysis.recommendations || []),
      ]
    );

    const analysisId = result.rows[0].id;

    console.log("✅ Analysis saved to database with ID:", analysisId);

    return NextResponse.json({
      success: true,
      data: { id: analysisId },
    });
  } catch (error) {
    console.error("Error saving analysis:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save analysis" },
      { status: 500 }
    );
  }
}

// GET - Fetch all user's analyses
export async function GET(request: NextRequest) {
  try {
    // ✅ FIXED: Await cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    // Fetch user's analyses from database
    const result = await db.query(
      `
      SELECT 
        id,
        file_name,
        company_name,
        job_title,
        overall_score,
        created_at
      FROM resume_analyses
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
      [decoded.userId]
    );

    console.log(
      `✅ Fetched ${result.rows.length} analyses for user ${decoded.userId}`
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching analyses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analyses" },
      { status: 500 }
    );
  }
}
