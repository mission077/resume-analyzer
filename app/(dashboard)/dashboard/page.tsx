"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [analysesError, setAnalysesError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

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
          setAnalyses(result.data);
          console.log("✅ Loaded analyses:", result.data);
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
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
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
                        <p className="text-xs text-gray-500">Score</p>
                        <p className="text-lg font-bold text-violet-600">
                          {analysis.overall_score}
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
                    <Button className="px-3 bg-transparent border border-red-300 text-red-600 hover:bg-red-50">
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
    </>
  );
}
