"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SubHeader } from "@/components/subHeader";
import { Button } from "@/components/ui/button";

interface AnalysisData {
  id: number;
  file_name: string;
  company_name: string;
  job_title: string;
  job_description: string;
  resume_text: string;
  overall_score: number;
  ats_score: number;
  status: string;
  created_at: string;
  analysis: any;
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        setIsLoading(true);
        console.log("🔍 Fetching analysis with ID:", id);

        const response = await fetch(`/api/analyses/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch analysis");
        }

        const result = await response.json();
        console.log("📊 Analysis data:", result);

        if (result.success) {
          setAnalysis(result.data);
        } else {
          throw new Error(result.error || "Failed to load analysis");
        }
      } catch (err) {
        console.error("❌ Error fetching analysis:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load analysis"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  if (isLoading) {
    return (
      <>
        <SubHeader />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analysis...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !analysis) {
    return (
      <>
        <SubHeader />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Analysis Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The analysis you're looking for doesn't exist."}
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-violet-500 text-white hover:bg-violet-600"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Parse analysis JSON if it's a string
  let parsedAnalysis = analysis.analysis;
  if (typeof analysis.analysis === "string") {
    try {
      parsedAnalysis = JSON.parse(analysis.analysis);
    } catch (e) {
      console.error("❌ Failed to parse analysis JSON:", e);
      parsedAnalysis = null;
    }
  }

  // Extract data with fallbacks
  const overallScore =
    parsedAnalysis?.overallScore ?? analysis.overall_score ?? 0;
  const atsScore = parsedAnalysis?.atsScore ?? analysis.ats_score ?? 0;
  const strengths = parsedAnalysis?.strengths ?? [];
  const gaps = parsedAnalysis?.gaps ?? [];
  const recommendations = parsedAnalysis?.recommendations ?? [];

  return (
    <>
      <SubHeader />
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Resume Analysis Complete
            </h1>
            <p className="text-muted-foreground">
              Here's your detailed analysis for {analysis.company_name}
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Resume Info */}
            <div className="space-y-6">
              {/* Job Details Card */}
              <div className="bg-card rounded-lg shadow-md p-6 border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Job Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Company:</span>
                    <p className="text-gray-900">{analysis.company_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Position:</span>
                    <p className="text-gray-900">{analysis.job_title}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Description:
                    </span>
                    <p className="text-gray-600 text-sm mt-1">
                      {analysis.job_description}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <p className="text-gray-600 text-sm">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resume Preview Card */}
              <div className="bg-card rounded-lg shadow-md p-6 border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Resume Preview
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {analysis.resume_text || "No resume text available"}
                  </pre>
                </div>
              </div>
            </div>

            {/* Right Column - Analysis Results */}
            <div className="space-y-6">
              {/* Overall Score Card */}
              <div className="bg-card rounded-lg shadow-md p-6 border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Overall Score
                </h2>
                <div className="text-center">
                  <div className="text-4xl font-bold text-violet-600 mb-2">
                    {overallScore}/100
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-violet-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${overallScore}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Resume Match Score
                  </p>
                </div>
              </div>

              {/* Strengths Card */}
              {strengths.length > 0 && (
                <div className="bg-card rounded-lg shadow-md p-6 border">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Strengths
                  </h2>
                  <ul className="space-y-2">
                    {strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps Card */}
              {gaps.length > 0 && (
                <div className="bg-card rounded-lg shadow-md p-6 border">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Areas for Improvement
                  </h2>
                  <ul className="space-y-2">
                    {gaps.map((gap: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">⚠</span>
                        <span className="text-gray-700">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations Card */}
              {recommendations.length > 0 && (
                <div className="bg-card rounded-lg shadow-md p-6 border">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Recommendations
                  </h2>
                  <ul className="space-y-2">
                    {recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">💡</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ATS Score Card */}
              <div className="bg-card rounded-lg shadow-md p-6 border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  ATS Score
                </h2>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {atsScore}/100
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${atsScore}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Applicant Tracking System Compatibility
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 text-center space-x-4">
            <Button
              onClick={() => router.push(`/dashboard/resumebuilder/build?analysisId=${id}`)}
              className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors font-semibold"
            >
              <svg
                className="w-5 h-5 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit & Improve Resume
            </Button>
            <Button className="bg-violet-500 text-white px-6 py-3 rounded-lg hover:bg-violet-600 transition-colors">
              Download Analysis Report
            </Button>
            <Button
              onClick={() => router.push("/dashboard/userform")}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Start New Analysis
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
