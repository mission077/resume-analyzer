"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SubHeader } from "@/components/subHeader";
import { Button } from "@/components/ui/button";

import type { ComprehensiveAnalysis } from '@/services/analysis/resumeAnalyzer'

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
  analysis: ComprehensiveAnalysis | any;
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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
        console.log("📊 Analysis.analysis:", result.data?.analysis);

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
  let parsedAnalysis: ComprehensiveAnalysis | null = null;
  console.log("🔍 Raw analysis.analysis:", analysis.analysis);
  console.log("🔍 Type of analysis.analysis:", typeof analysis.analysis);
  
  if (typeof analysis.analysis === "string") {
    try {
      parsedAnalysis = JSON.parse(analysis.analysis);
      console.log("✅ Parsed from string:", parsedAnalysis);
    } catch (e) {
      console.error("❌ Failed to parse analysis JSON:", e);
    }
  } else if (analysis.analysis) {
    parsedAnalysis = analysis.analysis;
    console.log("✅ Using analysis object directly:", parsedAnalysis);
  } else {
    console.warn("⚠️ No analysis data found in analysis.analysis");
  }
  
  console.log("📋 Final parsedAnalysis:", parsedAnalysis);

  // Extract comprehensive analysis data with fallbacks
  const atsScore = parsedAnalysis?.ats_score ?? analysis.ats_score ?? 0;
  const status = parsedAnalysis?.status ?? (atsScore >= 80 ? 'Excellent Match' : atsScore >= 60 ? 'Good Fit' : atsScore >= 40 ? 'Needs Work' : 'Major Gaps');
  const detailedAnalysis = parsedAnalysis?.detailed_analysis;
  const pros = parsedAnalysis?.pros ?? [];
  const cons = parsedAnalysis?.cons ?? [];
  const missingKeywords = parsedAnalysis?.missing_keywords ?? { critical: [], important: [], nice_to_have: [] };
  const matchedKeywords = parsedAnalysis?.matched_keywords ?? [];
  const keyInsights = parsedAnalysis?.key_insights ?? 'Analysis completed successfully';
  const sectionFeedback = parsedAnalysis?.section_feedback ?? [];
  const actionPlan = parsedAnalysis?.action_plan ?? [];
  const skillsMatchComparison = parsedAnalysis?.skills_match_comparison ?? [];
  const quickWins = parsedAnalysis?.quick_wins ?? [];
  const exampleEdit = parsedAnalysis?.example_edit;

  // Debug: Log extracted values
  console.log("🔍 Extracted values:", {
    atsScore,
    status,
    hasDetailedAnalysis: !!detailedAnalysis,
    prosCount: pros.length,
    consCount: cons.length,
    hasMissingKeywords: !!(missingKeywords.critical.length || missingKeywords.important.length || missingKeywords.nice_to_have.length),
    matchedKeywordsCount: matchedKeywords.length,
    hasKeyInsights: !!keyInsights,
    sectionFeedbackCount: sectionFeedback.length
  });

  return (
    <>
      <SubHeader />
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          {/* Top Navigation Buttons */}
          <div className="flex items-center justify-between mb-6">
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
            <Button
              onClick={() => router.push(`/dashboard/resumebuilder/build?analysisId=${id}`)}
              className="bg-violet-500 text-white px-6 py-3 rounded-lg hover:bg-violet-600 transition-colors"
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

          {/* Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Important:</span> All suggestions are based on your existing resume content. 
                Only include information that is true and verifiable. We help you reframe and reorganize what you already have, 
                not create new information.
              </p>
            </div>
          </div>

          {/* Analysis Results - Single Column */}
          <div className="space-y-6">
              {/* ATS Score Card - Prominent */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg shadow-md p-6 border border-violet-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-900">
                      ATS Score: {atsScore}/100
                    </h2>
                  </div>
                  <div className={`inline-block px-4 py-2 rounded-full text-base font-semibold mb-4 ${
                    status === 'Excellent Match' ? 'bg-green-100 text-green-800' :
                    status === 'Good Fit' ? 'bg-blue-100 text-blue-800' :
                    status === 'Needs Work' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Status: {status}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-5 mb-3">
                    <div
                      className={`h-5 rounded-full transition-all duration-1000 ${
                        atsScore >= 80 ? 'bg-green-500' :
                        atsScore >= 60 ? 'bg-blue-500' :
                        atsScore >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${atsScore}%` }}
                    ></div>
                  </div>
                  <p className="text-base text-gray-700 font-medium">
                    Your resume matches {atsScore}% of the job requirements
                  </p>
                </div>
              </div>

              {/* Key Insights - One Line */}
              {keyInsights && (
                <div className="rounded-lg shadow-md p-4 border border-blue-200 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-gray-800 text-base font-medium">{keyInsights}</p>
                  </div>
                </div>
              )}

              {/* Points to Review - Top 3 */}
              {actionPlan.length > 0 && (
                <div className="bg-card rounded-lg shadow-md p-6 border border-violet-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Points to Review
                  </h2>
                  <div className="space-y-3">
                    {actionPlan.map((item, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                          {item.priority}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium text-base">{item.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Match Comparison */}
              {skillsMatchComparison.length > 0 && (
                <div className="bg-card rounded-lg shadow-md p-6 border">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Skills Match Comparison
                  </h2>
                  <div className="space-y-3">
                    {skillsMatchComparison.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-2xl flex-shrink-0">{item.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{item.skill}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.status === 'strong' ? 'bg-green-100 text-green-700' :
                              item.status === 'listed_but_not_demonstrated' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {item.status === 'strong' ? 'Strong' :
                               item.status === 'listed_but_not_demonstrated' ? 'Listed but not demonstrated' :
                               'Missing'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">{item.evidence}</p>
                          {item.suggestion && (
                            <p className="text-violet-600 text-sm mt-1 font-medium">{item.suggestion}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Wins */}
              {quickWins.length > 0 && (
                <div className="bg-card rounded-lg shadow-md p-6 border border-green-200 bg-green-50">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Wins to Boost Your Score
                  </h2>
                  <div className="space-y-3">
                    {quickWins.map((win, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-green-200">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium text-base mb-1">{win.win}</p>
                          <p className="text-gray-600 text-sm">{win.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Analysis - Collapsible */}
              {detailedAnalysis && (
                <div className="bg-card rounded-lg shadow-md p-6 border">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Detailed Analysis
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(detailedAnalysis).map(([key, value]: [string, any]) => {
                      const isExpanded = expandedSections[`detail_${key}`];
                      return (
                        <div key={key} className="border border-gray-200 rounded-lg">
                          <button
                            onClick={() => setExpandedSections(prev => ({
                              ...prev,
                              [`detail_${key}`]: !isExpanded
                            }))}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <svg className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-semibold text-gray-900 capitalize text-base">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span className="text-base font-medium text-gray-600">
                                {value.score}/100
                              </span>
                            </div>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  value.score >= 80 ? 'bg-green-500' :
                                  value.score >= 60 ? 'bg-blue-500' :
                                  value.score >= 40 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${value.score}%` }}
                              ></div>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-3 border-t border-gray-200">
                              <p className="text-gray-800 text-base leading-relaxed">{value.feedback}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pros */}
                <div className="rounded-lg shadow-md p-6 border border-green-200 bg-green-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    What's Working Well
                  </h3>
                  <ul className="space-y-3">
                    {pros.map((pro: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-800 text-base leading-relaxed">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="rounded-lg shadow-md p-6 border border-red-200 bg-red-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-3">
                    {cons.map((con: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-800 text-base leading-relaxed">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Example Edit */}
              {exampleEdit && (
                <div className="bg-card rounded-lg shadow-md p-6 border border-violet-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Example Edit
                  </h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">Note:</span> This example shows how to format similar content based on your existing resume. 
                      Only use information from your actual experience.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Location: <span className="font-medium text-gray-900">{exampleEdit.location}</span></p>
                      <p className="text-sm text-gray-600">Section: <span className="font-medium text-gray-900 capitalize">{exampleEdit.section}</span></p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2 text-sm">Before:</h4>
                        <p className="text-gray-800 text-sm leading-relaxed">{exampleEdit.before}</p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2 text-sm">After:</h4>
                        <p className="text-gray-800 text-sm leading-relaxed">{exampleEdit.after}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2 text-sm">Format Improvements:</h4>
                      <ul className="space-y-1">
                        {exampleEdit.improvements.map((improvement, index) => (
                          <li key={index} className="text-gray-800 text-sm flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Keywords to Emphasize - Enhanced with Placement */}
              {(missingKeywords.critical.length > 0 || missingKeywords.important.length > 0 || missingKeywords.nice_to_have.length > 0) && (
                <div className="bg-card rounded-lg shadow-md p-6 border">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Keywords to Emphasize
                  </h3>
                  <div className="space-y-6">
                    {missingKeywords.critical.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-700 mb-4 text-base">Critical (High Impact):</h4>
                        <div className="space-y-3">
                          {missingKeywords.critical.map((keywordItem: any, index: number) => {
                            // Handle both old format (string) and new format (object with placement)
                            const isOldFormat = typeof keywordItem === 'string';
                            const keyword = isOldFormat ? keywordItem : keywordItem.keyword;
                            const placements = isOldFormat ? [] : keywordItem.where_to_add || [];
                            
                            return (
                              <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="font-semibold text-red-900 mb-2 text-base">{keyword}</p>
                                {placements.length > 0 ? (
                                  <div className="space-y-2">
                                    {placements.map((placement: any, pIndex: number) => (
                                      <div key={pIndex} className="pl-3 border-l-2 border-red-300">
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">{placement.location}</span> ({placement.section})
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{placement.suggestion}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">Add this keyword to relevant sections of your resume</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {missingKeywords.important.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-orange-700 mb-4 text-base">Important (Medium Impact):</h4>
                        <div className="space-y-3">
                          {missingKeywords.important.map((keywordItem: any, index: number) => {
                            const isOldFormat = typeof keywordItem === 'string';
                            const keyword = isOldFormat ? keywordItem : keywordItem.keyword;
                            const placements = isOldFormat ? [] : keywordItem.where_to_add || [];
                            
                            return (
                              <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="font-semibold text-orange-900 mb-2 text-base">{keyword}</p>
                                {placements.length > 0 ? (
                                  <div className="space-y-2">
                                    {placements.map((placement: any, pIndex: number) => (
                                      <div key={pIndex} className="pl-3 border-l-2 border-orange-300">
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">{placement.location}</span> ({placement.section})
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{placement.suggestion}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">Add this keyword to relevant sections of your resume</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {missingKeywords.nice_to_have.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-yellow-700 mb-4 text-base">Nice to Have (Low Impact):</h4>
                        <div className="space-y-3">
                          {missingKeywords.nice_to_have.map((keywordItem: any, index: number) => {
                            const isOldFormat = typeof keywordItem === 'string';
                            const keyword = isOldFormat ? keywordItem : keywordItem.keyword;
                            const placements = isOldFormat ? [] : keywordItem.where_to_add || [];
                            
                            return (
                              <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="font-semibold text-yellow-900 mb-2 text-base">{keyword}</p>
                                {placements.length > 0 ? (
                                  <div className="space-y-2">
                                    {placements.map((placement: any, pIndex: number) => (
                                      <div key={pIndex} className="pl-3 border-l-2 border-yellow-300">
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">{placement.location}</span> ({placement.section})
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{placement.suggestion}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">Add this keyword to relevant sections of your resume</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 text-center space-x-4">
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
