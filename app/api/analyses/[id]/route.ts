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
        analysis,
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

    const row = result.rows[0];
    
    // If comprehensive analysis exists in JSONB column, use it
    // Otherwise, construct from old columns for backward compatibility
    let analysisData = row.analysis;
    
    // Handle case where analysis is already a parsed object (from pg driver)
    if (analysisData && typeof analysisData === 'object' && !Array.isArray(analysisData)) {
      // Already parsed, use as-is
      console.log(`✅ Using comprehensive analysis from JSONB column for analysis #${analysisId}`);
    } else if (!analysisData && (row.ats_score !== null || row.overall_score !== null)) {
      // Construct old format for backward compatibility
      console.log(`⚠️ Analysis #${analysisId} is in old format, constructing compatibility object`);
      analysisData = {
        ats_score: row.ats_score ?? row.overall_score ?? 0,
        status: (row.ats_score ?? row.overall_score ?? 0) >= 80 ? 'Excellent Match' :
                (row.ats_score ?? row.overall_score ?? 0) >= 60 ? 'Good Fit' :
                (row.ats_score ?? row.overall_score ?? 0) >= 40 ? 'Needs Work' : 'Major Gaps',
        pros: Array.isArray(row.strengths) ? row.strengths : [],
        cons: Array.isArray(row.gaps) ? row.gaps : [],
        missing_keywords: { critical: [], important: [], nice_to_have: [] },
        matched_keywords: [],
        key_insights: 'Analysis completed',
        section_feedback: []
      };
    }

    console.log(
      `✅ Fetched analysis #${analysisId} for user ${decoded.userId}`,
      `Has comprehensive format: ${!!analysisData && typeof analysisData === 'object' && 'detailed_analysis' in analysisData}`
    );

    return NextResponse.json({
      success: true,
      data: {
        ...row,
        analysis: analysisData,
      },
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an analysis
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const { id: analysisId } = await context.params;

    // First verify the analysis belongs to the user
    const checkResult = await db.query(
      `SELECT id FROM resume_analyses WHERE id = $1 AND user_id = $2`,
      [analysisId, decoded.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Analysis not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the analysis
    await db.query(
      `DELETE FROM resume_analyses WHERE id = $1 AND user_id = $2`,
      [analysisId, decoded.userId]
    );

    console.log(
      `✅ Deleted analysis #${analysisId} for user ${decoded.userId}`
    );

    return NextResponse.json({
      success: true,
      message: "Analysis deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting analysis:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete analysis", message: error.message },
      { status: 500 }
    );
  }
}
