"use client";

import { SubHeader } from "@/components/subHeader";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ResumeData, PersonalInfo, Education, Experience, Project, Skill, Certification } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";

/**
 * Resume Builder Page
 * Supports pre-filling from analysis when analysisId query param is present
 */
export default function BuildResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId");

  // Form state
  const [formData, setFormData] = useState<ResumeData>({
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      website: "",
    },
    education: [],
    experiences: [],
    projects: [],
    skills: [],
    certifications: [],
    extracurriculars: [],
  });

  const [resumeTitle, setResumeTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill logic: Fetch analysis and parse resume text
  useEffect(() => {
    async function prefillFromAnalysis() {
      if (!analysisId) {
        // No analysisId = User is creating from scratch
        // Clear any old pre-fill data from localStorage to ensure clean form
        localStorage.removeItem("resumeBuilderPrefillData");
        localStorage.removeItem("resumeBuilderAnalysisId");
        console.log("🆕 Creating new resume from scratch - form is empty");
        return;
      }

      try {
        setIsPrefilling(true);
        setError(null);
        console.log("🔄 Starting pre-fill from analysis ID:", analysisId);

        // Step 1: Fetch analysis data
        const analysisResponse = await fetch(`/api/analyses/${analysisId}`);
        if (!analysisResponse.ok) {
          throw new Error("Failed to fetch analysis");
        }

        const analysisResult = await analysisResponse.json();
        if (!analysisResult.success) {
          throw new Error(analysisResult.error || "Analysis not found");
        }

        const analysis = analysisResult.data;
        const resumeText = analysis.resume_text;

        if (!resumeText) {
          throw new Error("No resume text found in analysis");
        }

        console.log("📄 Resume text extracted, length:", resumeText.length);

        // Step 2: Parse resume text using AI
        const parseResponse = await fetch("/api/resume/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText }),
        });

        if (!parseResponse.ok) {
          throw new Error("Failed to parse resume text");
        }

        const parseResult = await parseResponse.json();
        if (!parseResult.success || !parseResult.data) {
          throw new Error("Failed to parse resume data");
        }

        console.log("✅ Resume parsed successfully:", parseResult.data);

        // Step 3: Store parsed data and populate form
        const parsedData = parseResult.data as ResumeData;
        localStorage.setItem("resumeBuilderPrefillData", JSON.stringify(parsedData));
        localStorage.setItem("resumeBuilderAnalysisId", analysisId);
        setFormData(parsedData);

        console.log("💾 Pre-fill data saved and form populated");
      } catch (err) {
        console.error("❌ Pre-fill error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to pre-fill form"
        );
      } finally {
        setIsPrefilling(false);
      }
    }

    prefillFromAnalysis();
  }, [analysisId]);

  // Helper functions for form updates
  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Experience helpers
  const addExperience = () => {
    const newExp: Experience = {
      id: generateId(),
      company: "",
      role: "",
      startDate: "",
      endDate: null,
      isCurrent: false,
      location: "",
      description: [],
      type: "job",
    };
    setFormData((prev) => ({
      ...prev,
      experiences: [...prev.experiences, newExp],
    }));
  };

  const removeExperience = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const addExperienceBullet = (expId: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === expId
          ? { ...exp, description: [...exp.description, ""] }
          : exp
      ),
    }));
  };

  const removeExperienceBullet = (expId: string, bulletIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              description: exp.description.filter((_, i) => i !== bulletIndex),
            }
          : exp
      ),
    }));
  };

  const updateExperienceBullet = (expId: string, bulletIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              description: exp.description.map((bullet, i) =>
                i === bulletIndex ? value : bullet
              ),
            }
          : exp
      ),
    }));
  };

  return (
    <>
      <SubHeader />
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Loading State - Pre-filling */}
          {isPrefilling && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center mb-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Pre-filling Your Resume...
              </h2>
              <p className="text-gray-600">
                Analyzing your resume and extracting information. This may take 10-15 seconds.
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isPrefilling && (
            <div className="bg-white rounded-lg shadow-md border border-red-200 p-8 text-center mb-8">
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
                Pre-fill Failed
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-violet-500 text-white hover:bg-violet-600"
              >
                Back to Dashboard
              </Button>
            </div>
          )}

          {/* Resume Title */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              placeholder="e.g., Software Engineer Resume - Google"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Give your resume a name to identify it later
            </p>
          </div>

          {/* Personal Information Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personalInfo.firstName}
                  onChange={(e) => updatePersonalInfo("firstName", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personalInfo.lastName}
                  onChange={(e) => updatePersonalInfo("lastName", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo("email", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn (Optional)
                </label>
                <input
                  type="url"
                  value={formData.personalInfo.linkedin || ""}
                  onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                  placeholder="linkedin.com/in/yourprofile"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub (Optional)
                </label>
                <input
                  type="url"
                  value={formData.personalInfo.github || ""}
                  onChange={(e) => updatePersonalInfo("github", e.target.value)}
                  placeholder="github.com/yourusername"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={formData.personalInfo.website || ""}
                  onChange={(e) => updatePersonalInfo("website", e.target.value)}
                  placeholder="yourwebsite.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Experience Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Experience</h2>
              <Button
                onClick={addExperience}
                className="bg-violet-500 text-white hover:bg-violet-600"
              >
                + Add Experience
              </Button>
            </div>

            {formData.experiences.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No experiences added yet. Click "Add Experience" to get started.
              </p>
            ) : (
              <div className="space-y-6">
                {formData.experiences.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Experience #{index + 1}
                      </h3>
                      <Button
                        onClick={() => removeExperience(exp.id)}
                        className="bg-red-500 text-white hover:bg-red-600 text-sm"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(exp.id, "company", e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position/Role <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) =>
                            updateExperience(exp.id, "role", e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <select
                          value={exp.type || "job"}
                          onChange={(e) =>
                            updateExperience(
                              exp.id,
                              "type",
                              e.target.value as Experience["type"]
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        >
                          <option value="job">Job</option>
                          <option value="internship">Internship</option>
                          <option value="contract">Contract</option>
                          <option value="freelance">Freelance</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) =>
                            updateExperience(exp.id, "location", e.target.value)
                          }
                          placeholder="e.g., San Francisco, CA or Remote"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateExperience(exp.id, "startDate", e.target.value)
                          }
                          placeholder="e.g., Jan 2023"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={exp.endDate || ""}
                            onChange={(e) =>
                              updateExperience(
                                exp.id,
                                "endDate",
                                e.target.value || null
                              )
                            }
                            placeholder="e.g., Dec 2024"
                            disabled={exp.isCurrent}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <label className="flex items-center gap-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={exp.isCurrent}
                              onChange={(e) => {
                                updateExperience(exp.id, "isCurrent", e.target.checked);
                                if (e.target.checked) {
                                  updateExperience(exp.id, "endDate", null);
                                }
                              }}
                              className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-sm text-gray-700">Current</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Description/Bullet Points
                        </label>
                        <Button
                          onClick={() => addExperienceBullet(exp.id)}
                          className="bg-violet-500 text-white hover:bg-violet-600 text-sm"
                        >
                          + Add Bullet
                        </Button>
                      </div>
                      {exp.description.length === 0 ? (
                        <p className="text-gray-500 text-sm py-2">
                          No bullet points yet. Click "Add Bullet" to add descriptions.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {exp.description.map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex items-start gap-2">
                              <span className="text-gray-500 mt-2">•</span>
                              <textarea
                                value={bullet}
                                onChange={(e) =>
                                  updateExperienceBullet(
                                    exp.id,
                                    bulletIndex,
                                    e.target.value
                                  )
                                }
                                placeholder="Enter bullet point (supports **bold** markdown)"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y min-h-[60px]"
                              />
                              <Button
                                onClick={() => removeExperienceBullet(exp.id, bulletIndex)}
                                className="bg-red-500 text-white hover:bg-red-600 text-sm mt-1"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Tip: Use <code>**text**</code> for bold formatting
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mb-8">
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-gray-500 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log("Generate PDF - Coming soon");
                // TODO: Implement PDF generation
              }}
              className="bg-violet-500 text-white hover:bg-violet-600"
              disabled={!resumeTitle || !formData.personalInfo.firstName}
            >
              Generate PDF Resume
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
