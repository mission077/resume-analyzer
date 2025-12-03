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
      // Include all required fields from ComprehensiveAnalysis interface
      console.log(`⚠️ Analysis #${analysisId} is in old format, constructing compatibility object`);
      const score = row.ats_score ?? row.overall_score ?? 0;
      analysisData = {
        ats_score: score,
        status: score >= 80 ? 'Excellent Match' :
                score >= 60 ? 'Good Fit' :
                score >= 40 ? 'Needs Work' : 'Major Gaps',
        key_insights: 'Analysis completed',
        action_plan: [
          { priority: 1, action: 'Review and incorporate missing keywords', time_estimate: '10 min' },
          { priority: 2, action: 'Add quantifiable metrics to achievements', time_estimate: '15 min' },
          { priority: 3, action: 'Enhance project descriptions with relevant technologies', time_estimate: '10 min' }
        ],
        skills_match_comparison: [],
        quick_wins: [
          { win: 'Highlight your strongest projects at the top', impact: 'Better alignment with job requirements' },
          { win: 'Add specific technologies mentioned in job description', impact: 'Increases ATS keyword matching' }
        ],
        missing_keywords: { critical: [], important: [], nice_to_have: [] },
        example_edit: {
          section: 'projects',
          location: 'Your projects section',
          before: 'Built an AI-powered system',
          after: 'Built a multi-agent AI system with Node.js backend, implementing observability with logging and tracing',
          improvements: ['Added multi-agent terminology', 'Specified Node.js backend', 'Included observability keywords']
        },
        detailed_analysis: {
          content_quality: { score: score, feedback: 'Content quality analysis completed' },
          skills_match: { score: score, feedback: 'Skills match analysis completed' },
          structure_format: { score: score, feedback: 'Structure and format analysis completed' },
          tone_style: { score: score, feedback: 'Tone and style analysis completed' },
          experience_relevance: { score: score, feedback: 'Experience relevance analysis completed' }
        },
        pros: (() => {
          try {
            const parsed = typeof row.strengths === 'string' ? JSON.parse(row.strengths) : row.strengths;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })(),
        cons: (() => {
          try {
            const parsed = typeof row.gaps === 'string' ? JSON.parse(row.gaps) : row.gaps;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })(),
        matched_keywords: [],
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
