import { NextRequest, NextResponse } from "next/server";
import { generateResumePdf } from "@/services/resumeGeneration/latexCompiler";

/**
 * POST - Generate PDF resume using LaTeX compiler service
 * Takes resume data and returns a PDF file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      personalInfo,
      education,
      experiences,
      projects,
      skills,
      certifications = [],
      extracurriculars = [],
    } = body;

    // Validate required fields
    if (!title || !personalInfo) {
      return NextResponse.json(
        { success: false, error: "Title and personal info are required" },
        { status: 400 }
      );
    }

    if (
      !personalInfo.firstName ||
      !personalInfo.lastName ||
      !personalInfo.email ||
      !personalInfo.phone
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Personal info must include firstName, lastName, email, and phone",
        },
        { status: 400 }
      );
    }

    console.log("📄 Generating PDF for resume:", title);

    // Generate PDF via LaTeX service
    const result = await generateResumePdf({
      title,
      personalInfo,
      education: education || [],
      experiences: experiences || [],
      projects: projects || [],
      skills: skills || {},
      certifications,
      extracurriculars,
    });

    if (!result.success || !result.pdfBlob) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to generate PDF",
        },
        { status: 500 }
      );
    }

    // Return PDF file
    return new NextResponse(result.pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${title || "resume"}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate PDF",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

