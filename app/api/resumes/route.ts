import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * POST - Save new resume to database
 * Creates a new resume record with all user data
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    const body = await request.json();
    const {
      title,
      personalInfo,
      education,
      experiences,
      projects,
      skills,
      certifications,
      sourceType = "generated",
      analysisId = null,
    } = body;

    // Validate required fields
    if (!title || !personalInfo) {
      return NextResponse.json(
        { success: false, error: "Title and personal info are required" },
        { status: 400 }
      );
    }

    // Validate personal info structure
    if (
      !personalInfo.firstName ||
      !personalInfo.lastName ||
      !personalInfo.phone ||
      !personalInfo.email
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Personal info must include firstName, lastName, phone, and email",
        },
        { status: 400 }
      );
    }

    // Insert into database
    const result = await db.query(
      `
      INSERT INTO resumes (
        user_id,
        title,
        personal_info,
        education,
        experiences,
        projects,
        skills,
        certifications,
        source_type,
        analysis_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, title, created_at
    `,
      [
        decoded.userId,
        title,
        JSON.stringify(personalInfo),
        JSON.stringify(education || []),
        JSON.stringify(experiences || []),
        JSON.stringify(projects || []),
        JSON.stringify(skills || {}),
        JSON.stringify(certifications || []),
        sourceType,
        analysisId,
      ]
    );

    const resumeId = result.rows[0].id;

    console.log("✅ Resume saved to database with ID:", resumeId);

    return NextResponse.json({
      success: true,
      data: {
        id: resumeId,
        title: result.rows[0].title,
        created_at: result.rows[0].created_at,
      },
    });
  } catch (error: any) {
    console.error("Error saving resume:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save resume", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch all user's resumes
 * Returns list of resumes with basic info (id, title, created_at)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    // Fetch user's resumes from database
    const result = await db.query(
      `
      SELECT 
        id,
        title,
        source_type,
        created_at,
        updated_at
      FROM resumes
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
      [decoded.userId]
    );

    console.log(
      `✅ Fetched ${result.rows.length} resumes for user ${decoded.userId}`
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resumes", message: error.message },
      { status: 500 }
    );
  }
}

