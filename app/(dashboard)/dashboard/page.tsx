"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { SubHeader } from "@/components/subHeader";
import { Button } from "@/components/ui/button";
import * as Strings from "@/components/ui/strings";
import jsPDF from "jspdf";

interface Analysis {
  id: number;
  file_name: string;
  company_name: string;
  job_title: string;
  overall_score: number;
  ats_score: number;
  created_at: string;
  status?: string;
  analysis?: {
    atsScore?: number;
    status?: string;
    overallScore?: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [analysesError, setAnalysesError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/sign-in");
          return;
        }
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/sign-in");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    async function fetchAnalyses() {
      try {
        setAnalysesLoading(true);
        console.log("🔍 Fetching analyses from database...");
        const response = await fetch("/api/analyses");
        if (!response.ok) {
          throw new Error("Failed to fetch analyses");
        }
        const result = await response.json();
        console.log("📊 API Response:", result);
        if (result.success) {
          // Process analyses to extract ATS score and status from analysis JSONB
          const analysesWithDetails = result.data.map((analysis: any) => {
            let analysisData = analysis.analysis;
            
            // Handle parsed JSONB or string
            if (typeof analysisData === 'string') {
              try {
                analysisData = JSON.parse(analysisData);
              } catch (e) {
                analysisData = null;
              }
            }
            
            // Extract ATS score and status
            const atsScore = analysisData?.atsScore || analysisData?.ats_score || analysis.ats_score || analysis.overall_score || null;
            let status = analysisData?.status;
            
            // Calculate status if not present
            if (!status && atsScore !== null) {
              status = atsScore >= 80 ? 'Excellent Match' :
                       atsScore >= 60 ? 'Good Fit' :
                       atsScore >= 40 ? 'Needs Work' : 'Major Gaps';
            }
            
            return {
              ...analysis,
              analysis: {
                atsScore,
                status,
                overallScore: analysisData?.overallScore || analysis.overall_score
              }
            };
          });
          
          setAnalyses(analysesWithDetails);
          console.log("✅ Loaded analyses:", analysesWithDetails);
        } else {
          throw new Error(result.error || "Failed to load analyses");
        }
      } catch (err) {
        console.error("❌ Error fetching analyses:", err);
        setAnalysesError(
          err instanceof Error ? err.message : "Failed to load analyses"
        );
      } finally {
        setAnalysesLoading(false);
      }
    }
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showDeleteModal) {
        setShowDeleteModal(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showDeleteModal]);

  // ✅ Download Analysis Report as PDF
  const handleDownloadReport = async (analysisId: number) => {
    try {
      setDownloadingId(analysisId);
      console.log("📥 Downloading analysis report for ID:", analysisId);

      // Fetch full analysis data
      const response = await fetch(`/api/analyses/${analysisId}`);
      if (!response.ok) throw new Error("Failed to fetch analysis");

      const result = await response.json();
      if (!result.success) throw new Error("Failed to load analysis data");

      const data = result.data;

      // Parse analysis JSON
      let parsedAnalysis = data.analysis;
      if (typeof data.analysis === "string") {
        parsedAnalysis = JSON.parse(data.analysis);
      }

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      doc.setFontSize(22);
      doc.setTextColor(124, 58, 237); // Violet
      doc.text("Resume Analysis Report", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Job Details Section
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Job Details", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Company: ${data.company_name}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Position: ${data.job_title}`, 20, yPosition);
      yPosition += 6;
      doc.text(`File: ${data.file_name}`, 20, yPosition);
      yPosition += 6;
      doc.text(
        `Date: ${new Date(data.created_at).toLocaleDateString()}`,
        20,
        yPosition
      );
      yPosition += 15;

      // Scores Section
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Scores", 20, yPosition);
      yPosition += 10;

      // Score boxes
      doc.setFillColor(124, 58, 237);
      doc.rect(20, yPosition, 80, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text("Overall Score", 25, yPosition + 8);
      doc.setFontSize(20);
      doc.text(
        `${parsedAnalysis?.overallScore || data.overall_score}/100`,
        25,
        yPosition + 18
      );

      doc.setFillColor(59, 130, 246);
      doc.rect(110, yPosition, 80, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text("ATS Score", 115, yPosition + 8);
      doc.setFontSize(20);
      doc.text(
        `${parsedAnalysis?.atsScore || data.ats_score}/100`,
        115,
        yPosition + 18
      );
      yPosition += 35;

      // Strengths Section
      if (parsedAnalysis?.strengths?.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("Strengths", 20, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        parsedAnalysis.strengths.forEach((strength: string, index: number) => {
          const lines = doc.splitTextToSize(`${index + 1}. ${strength}`, 170);
          lines.forEach((line: string) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, 20, yPosition);
            yPosition += 6;
          });
        });
        yPosition += 10;
      }

      // Gaps Section
      if (parsedAnalysis?.gaps?.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("Areas for Improvement", 20, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        parsedAnalysis.gaps.forEach((gap: string, index: number) => {
          const lines = doc.splitTextToSize(`${index + 1}. ${gap}`, 170);
          lines.forEach((line: string) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, 20, yPosition);
            yPosition += 6;
          });
        });
        yPosition += 10;
      }

      // Recommendations Section
      if (parsedAnalysis?.recommendations?.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("Recommendations", 20, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        parsedAnalysis.recommendations.forEach((rec: string, index: number) => {
          const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 170);
          lines.forEach((line: string) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, 20, yPosition);
            yPosition += 6;
          });
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated by Resume Analyzer - Page ${i} of ${pageCount}`,
          pageWidth / 2,
          285,
          { align: "center" }
        );
      }

      // Save PDF
      doc.save(
        `${data.company_name}_${data.job_title}_Analysis.pdf`.replace(
          /\s+/g,
          "_"
        )
      );
      console.log("✅ PDF downloaded successfully!");
    } catch (error) {
      console.error("❌ Error downloading report:", error);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  // ✅ Delete Analysis
  const handleDeleteClick = (analysisId: number) => {
    console.log("🗑️ Delete button clicked for analysis:", analysisId);
    setShowDeleteModal(analysisId);
    console.log("✅ Modal state set to:", analysisId);
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteModal) return;

    const analysisId = showDeleteModal;
    setShowDeleteModal(null);

    try {
      setDeletingId(analysisId);
      console.log("🗑️ Deleting analysis ID:", analysisId);

      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete analysis");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to delete analysis");
      }

      // Remove from state
      setAnalyses((prev) => prev.filter((a) => a.id !== analysisId));
      console.log("✅ Analysis deleted successfully!");
      
      // Show success toast
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error("❌ Error deleting analysis:", error);
      alert("Failed to delete analysis. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SubHeader />
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-10">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="pb-6">
              <h1 className="text-3xl font-bold text-gray-800 pb-2">
                {Strings.dashboard}
              </h1>
              <p className="text-md text-gray-600">{Strings.dashboardDesc}</p>
              {user && (
                <p className="text-sm text-gray-600 mt-2">
                  Logged in as:{" "}
                  <span className="font-semibold">{user.email}</span>
                </p>
              )}
              {!analysesLoading && (
                <p className="text-sm text-violet-600 mt-1">
                  {analyses.length}{" "}
                  {analyses.length === 1 ? "analysis" : "analyses"} saved
                </p>
              )}
            </div>
            <div>
              <Button className="md:inline-flex px-6 bg-violet-500 hover:bg-violet-600">
                <Link href={"/dashboard/userform"}>{Strings.newAnalysis}</Link>
              </Button>
            </div>
          </div>

          {/* Create Resume Section */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-500 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Don't have a resume?
                  </h2>
                  <p className="text-sm text-gray-600">
                    Generate a professional resume tailored to your experience
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/dashboard/resumebuilder/build")}
                className="px-6 py-2 bg-violet-500 hover:bg-violet-600 text-white font-semibold"
              >
                Generate Resume
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {analysesLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your analyses...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {analysesError && !analysesLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{analysesError}</p>
              <Button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Grid Layout for Cards */}
          {!analysesLoading && !analysesError && analyses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  {/* File Icon & Info */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-8 h-8 text-violet-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate mb-1">
                        {analysis.file_name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {analysis.job_title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {analysis.company_name}
                      </p>
                    </div>
                  </div>

                  {/* Score Section */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-violet-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500">ATS Score</p>
                          <p className="text-xl font-bold text-violet-600">
                            {analysis.analysis?.atsScore || analysis.ats_score || analysis.overall_score || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-xs text-gray-500">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {analysis.analysis?.status && (
                      <div className="mt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          analysis.analysis.status === 'Excellent Match' ? 'bg-green-100 text-green-800' :
                          analysis.analysis.status === 'Good Fit' ? 'bg-blue-100 text-blue-800' :
                          analysis.analysis.status === 'Needs Work' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {analysis.analysis.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-violet-500 hover:bg-violet-600 text-white">
                      <Link href={`/dashboard/analysis/${analysis.id}`}>
                        View
                      </Link>
                    </Button>
                    <Button
                      onClick={() => handleDownloadReport(analysis.id)}
                      disabled={downloadingId === analysis.id}
                      className="flex-1 bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {downloadingId === analysis.id ? (
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
                        </span>
                      ) : (
                        "Download"
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick(analysis.id);
                      }}
                      disabled={deletingId === analysis.id}
                      className="px-3 bg-transparent border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Delete analysis"
                    >
                      {deletingId === analysis.id ? (
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
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!analysesLoading && !analysesError && analyses.length === 0 && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No analyses yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by uploading your first resume for analysis
              </p>
              <Button
                onClick={() => router.push("/dashboard/userform")}
                className="px-6 py-3 bg-violet-500 text-white hover:bg-violet-600"
              >
                Upload Resume
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal - Rendered via Portal */}
      {isMounted && showDeleteModal && createPortal(
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={handleDeleteCancel}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Analysis
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this analysis? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deletingId === showDeleteModal}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === showDeleteModal ? (
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
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-in slide-in-from-top-5">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">Analysis deleted successfully</span>
        </div>
      )}
    </>
  );
}
