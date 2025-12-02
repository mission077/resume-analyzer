"use client";

import { SubHeader } from "@/components/subHeader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ResumeData } from "@/lib/resume/types";

interface PreviewData {
  pdfBlob: Blob;
  resumeData: {
    title: string;
    personalInfo: ResumeData["personalInfo"];
    education: ResumeData["education"];
    experiences: ResumeData["experiences"];
    projects: ResumeData["projects"];
    skills: ResumeData["skills"];
    certifications: ResumeData["certifications"];
    extracurriculars: ResumeData["extracurriculars"];
  };
  analysisId?: string | null;
}

export default function PreviewPage() {
  const router = useRouter();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load preview data from sessionStorage
    const storedData = sessionStorage.getItem("resumePreviewData");
    
    if (!storedData) {
      // No preview data found, redirect back to build page
      alert("No preview data found. Please generate your resume first.");
      router.push("/dashboard/resumebuilder/build");
      return;
    }

    try {
      const parsed = JSON.parse(storedData);
      
      // Convert base64 blob back to Blob
      const byteCharacters = atob(parsed.pdfBlob);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      
      // Create object URL for iframe
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      setPreviewData({
        pdfBlob: blob,
        resumeData: parsed.resumeData,
        analysisId: parsed.analysisId || null,
      });
    } catch (err) {
      console.error("Error parsing preview data:", err);
      setError("Failed to load preview data");
    }

    // Cleanup: revoke URL when component unmounts
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [router]);

  const handleDownload = () => {
    if (!previewData) return;
    
    setIsDownloading(true);
    try {
      const url = URL.createObjectURL(previewData.pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${previewData.resumeData.title || "resume"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log("✅ PDF downloaded successfully");
    } catch (err) {
      console.error("❌ Error downloading PDF:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!previewData) return;

    setIsSaving(true);
    setError(null);

    try {
      // Skills are stored as object format {category: "skill1, skill2"} from build page
      // Handle both array and object formats for safety
      let skillsObject: Record<string, string> = {};
      if (Array.isArray(previewData.resumeData.skills)) {
        // Convert from array format (shouldn't happen, but handle it)
        previewData.resumeData.skills.forEach((skill: any) => {
          if (!skillsObject[skill.category]) {
            skillsObject[skill.category] = "";
          }
          if (skillsObject[skill.category]) {
            skillsObject[skill.category] += ", ";
          }
          skillsObject[skill.category] += skill.name;
        });
      } else {
        skillsObject = previewData.resumeData.skills as Record<string, string>;
      }

      // Save to database
      const response = await fetch("/api/resumes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: previewData.resumeData.title,
          personalInfo: previewData.resumeData.personalInfo,
          education: previewData.resumeData.education,
          experiences: previewData.resumeData.experiences,
          projects: previewData.resumeData.projects,
          skills: skillsObject,
          certifications: previewData.resumeData.certifications || [],
          // Note: extracurriculars not saved to DB yet (not in schema)
          sourceType: previewData.analysisId ? "from_analysis" : "generated",
          analysisId: previewData.analysisId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save resume");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to save resume");
      }

      console.log("✅ Resume saved successfully");

      // Clean up sessionStorage
      sessionStorage.removeItem("resumePreviewData");
      sessionStorage.removeItem("resumeBuilderFormData");
      sessionStorage.removeItem("resumeBuilderTitle");
      sessionStorage.removeItem("resumeBuilderSkills");

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Error saving resume:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save resume. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!previewData || !pdfUrl) {
    return (
      <>
        <SubHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading preview...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SubHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Resume Preview
            </h1>
            <p className="text-gray-600">
              Review your resume before saving or downloading
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* PDF Preview */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {previewData.resumeData.title || "Resume"}
              </h2>
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full h-[800px]"
                title="Resume Preview"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              onClick={() => {
                // Set a flag to indicate we're navigating from preview page
                // This tells the build page to restore form data instead of clearing it
                sessionStorage.setItem("restoreFromPreview", "true");
                // Keep form data in sessionStorage so it can be restored when going back
                // IMPORTANT: Navigate WITHOUT analysisId to prevent analysis pre-fill from running
                // The saved form data in sessionStorage will be restored instead
                router.push("/dashboard/resumebuilder/build");
              }}
              className="bg-gray-500 text-white hover:bg-gray-600"
            >
              Back to Edit
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isDownloading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Downloading...
                </span>
              ) : (
                "Download PDF"
              )}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Resume"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

