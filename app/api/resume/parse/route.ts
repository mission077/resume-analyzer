import { NextRequest, NextResponse } from "next/server";
import { parseResumeText } from "@/lib/parsingResumeData/resumeParser";

/**
 * POST - Parse unstructured resume text into structured data
 * Takes resume text (from uploaded PDF/DOCX) and uses AI to extract structured information
 * Returns data ready to pre-fill the resume builder form
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText } = body;

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: "Resume text is required" },
        { status: 400 }
      );
    }

    console.log("🤖 Starting resume text parsing...");
    const parseResult = await parseResumeText(resumeText);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Parsing failed",
          message: parseResult.error,
        },
        { status: 500 }
      );
    }

    console.log("✅ Resume parsing complete");

    return NextResponse.json({
      success: true,
      message: "Resume parsed successfully",
      data: parseResult.data,
    });
  } catch (error: any) {
    console.error("Error parsing resume:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to parse resume",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

