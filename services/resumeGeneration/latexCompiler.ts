import { ResumeData, SkillsObject } from "@/lib/resume/types";

const LATEX_API_URL = process.env.NEXT_PUBLIC_LATEX_API_URL || "http://localhost:8001";

export interface GeneratePdfRequest {
  title: string;
  personalInfo: ResumeData["personalInfo"];
  education: ResumeData["education"];
  experiences: ResumeData["experiences"];
  projects: ResumeData["projects"];
  skills: SkillsObject; // Object format: { "Languages": "Python, JS", ... }
  certifications?: ResumeData["certifications"];
  extracurriculars?: any[];
}

export interface GeneratePdfResponse {
  success: boolean;
  error?: string;
  pdfBlob?: Blob;
}

/**
 * Generate PDF resume using LaTeX compiler service
 * 
 * @param data - Resume data in the format expected by the LaTeX template
 * @returns PDF blob or error
 */
export async function generateResumePdf(
  data: GeneratePdfRequest
): Promise<GeneratePdfResponse> {
  try {
    console.log("📄 Generating PDF via LaTeX service...");
    
    const response = await fetch(`${LATEX_API_URL}/compile-resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `LaTeX API error: ${response.status} - ${errorText}`
      );
    }

    // Get PDF blob
    const pdfBlob = await response.blob();

    console.log("✅ PDF generated successfully");

    return {
      success: true,
      pdfBlob,
    };
  } catch (error: any) {
    console.error("❌ PDF generation failed:", error);
    return {
      success: false,
      error: error.message || "PDF generation failed",
    };
  }
}

