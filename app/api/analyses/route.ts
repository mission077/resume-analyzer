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

    // Extract ATS score for backward compatibility
    const atsScore = analysis.ats_score ?? analysis.atsScore ?? null;
    const overallScore = analysis.ats_score ?? analysis.atsScore ?? analysis.overallScore ?? null;

    // Insert into database - save comprehensive analysis in JSONB column
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
        analysis,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed')
      RETURNING id
    `,
      [
        decoded.userId,
        fileName,
        companyName,
        jobTitle,
        jobDescription,
        resumeText,
        overallScore,
        atsScore,
        JSON.stringify(analysis.pros || analysis.strengths || []),
        JSON.stringify(analysis.cons || analysis.gaps || []),
        JSON.stringify(analysis.recommendations || []),
        JSON.stringify(analysis), // Store full comprehensive analysis
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
        ats_score,
        analysis,
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
