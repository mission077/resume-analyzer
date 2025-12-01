import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * GET - Fetch single resume by ID
 * Returns complete resume data including all sections
 */
export async function GET(
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
    const { id: resumeId } = await context.params;

    // Fetch specific resume from database
    const result = await db.query(
      `
      SELECT 
        id,
        user_id,
        title,
        personal_info,
        education,
        experiences,
        projects,
        skills,
        certifications,
        source_type,
        analysis_id,
        created_at,
        updated_at
      FROM resumes
      WHERE id = $1 AND user_id = $2
    `,
      [resumeId, decoded.userId]
    );

    // Check if resume exists and belongs to user
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    console.log(
      `✅ Fetched resume #${resumeId} for user ${decoded.userId}`
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error fetching resume:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resume", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update existing resume
 * Updates all resume fields
 */
export async function PUT(
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
    const { id: resumeId } = await context.params;

    const body = await request.json();
    const {
      title,
      personalInfo,
      education,
      experiences,
      projects,
      skills,
      certifications,
    } = body;

    // Validate required fields
    if (!title || !personalInfo) {
      return NextResponse.json(
        { success: false, error: "Title and personal info are required" },
        { status: 400 }
      );
    }

    // Check if resume exists and belongs to user
    const checkResult = await db.query(
      `SELECT id FROM resumes WHERE id = $1 AND user_id = $2`,
      [resumeId, decoded.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // Update resume
    const result = await db.query(
      `
      UPDATE resumes
      SET
        title = $1,
        personal_info = $2,
        education = $3,
        experiences = $4,
        projects = $5,
        skills = $6,
        certifications = $7,
        updated_at = NOW()
      WHERE id = $8 AND user_id = $9
      RETURNING id, title, updated_at
    `,
      [
        title,
        JSON.stringify(personalInfo),
        JSON.stringify(education || []),
        JSON.stringify(experiences || []),
        JSON.stringify(projects || []),
        JSON.stringify(skills || {}),
        JSON.stringify(certifications || []),
        resumeId,
        decoded.userId,
      ]
    );

    console.log(`✅ Updated resume #${resumeId} for user ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      data: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        updated_at: result.rows[0].updated_at,
      },
    });
  } catch (error: any) {
    console.error("Error updating resume:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update resume", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete resume
 * Removes resume from database
 */
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
    const { id: resumeId } = await context.params;

    // Check if resume exists and belongs to user
    const checkResult = await db.query(
      `SELECT id FROM resumes WHERE id = $1 AND user_id = $2`,
      [resumeId, decoded.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // Delete resume
    await db.query(
      `DELETE FROM resumes WHERE id = $1 AND user_id = $2`,
      [resumeId, decoded.userId]
    );

    console.log(`✅ Deleted resume #${resumeId} for user ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting resume:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete resume", message: error.message },
      { status: 500 }
    );
  }
}

