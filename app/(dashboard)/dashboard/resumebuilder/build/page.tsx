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
        
        // Normalize data to ensure arrays are always initialized
        const normalizedData: ResumeData = {
          ...parsedData,
          projects: parsedData.projects.map((proj) => ({
            ...proj,
            techStack: Array.isArray(proj.techStack) ? proj.techStack : [],
            description: Array.isArray(proj.description) 
              ? proj.description 
              : typeof proj.description === 'string' 
                ? [proj.description] 
                : [],
          })),
          experiences: parsedData.experiences.map((exp) => ({
            ...exp,
            description: Array.isArray(exp.description) 
              ? exp.description 
              : typeof exp.description === 'string' 
                ? [exp.description] 
                : [],
          })),
          education: parsedData.education.map((edu) => ({
            ...edu,
            academicAchievements: Array.isArray(edu.academicAchievements) 
              ? edu.academicAchievements 
              : [],
          })),
        };
        
        localStorage.setItem("resumeBuilderPrefillData", JSON.stringify(normalizedData));
        localStorage.setItem("resumeBuilderAnalysisId", analysisId);
        setFormData(normalizedData);

        // Convert skills array to object format for the form
        if (parsedData.skills && parsedData.skills.length > 0) {
          const skillsObj: Record<string, string> = {
            Languages: "",
            "Frameworks and Libraries": "",
            "Development Tools": "",
          };
          parsedData.skills.forEach((skill) => {
            const category =
              skill.category === "language"
                ? "Languages"
                : skill.category === "framework"
                ? "Frameworks and Libraries"
                : skill.category === "tool"
                ? "Development Tools"
                : skill.category;
            if (!skillsObj[category]) {
              skillsObj[category] = "";
            }
            skillsObj[category] += (skillsObj[category] ? ", " : "") + skill.name;
          });
          setSkillsObject(skillsObj);
        }

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

  // Education helpers
  const addEducation = () => {
    const newEdu: Education = {
      id: generateId(),
      school: "",
      degree: "",
      field: "",
      location: "",
      graduationDate: "",
      gpa: "",
      academicAchievements: [],
      isCurrent: false,
    };
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  const removeEducation = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const addEducationHonor = (eduId: string) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === eduId
          ? {
              ...edu,
              academicAchievements: [
                ...(edu.academicAchievements || []),
                "",
              ],
            }
          : edu
      ),
    }));
  };

  const removeEducationHonor = (eduId: string, honorIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === eduId
          ? {
              ...edu,
              academicAchievements: (edu.academicAchievements || []).filter(
                (_, i) => i !== honorIndex
              ),
            }
          : edu
      ),
    }));
  };

  const updateEducationHonor = (eduId: string, honorIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === eduId
          ? {
              ...edu,
              academicAchievements: (edu.academicAchievements || []).map((honor, i) =>
                i === honorIndex ? value : honor
              ),
            }
          : edu
      ),
    }));
  };

  // Skills helpers - Using object format for easier management
  const [skillsObject, setSkillsObject] = useState<Record<string, string>>({
    Languages: "",
    "Frameworks and Libraries": "",
    "Development Tools": "",
  });

  const updateSkillCategory = (category: string, value: string) => {
    setSkillsObject((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const addCustomSkillCategory = () => {
    const categoryName = prompt("Enter category name (e.g., AI Tools, Cloud Services):");
    if (categoryName && categoryName.trim()) {
      setSkillsObject((prev) => ({
        ...prev,
        [categoryName.trim()]: "",
      }));
    }
  };

  const removeSkillCategory = (category: string) => {
    // Don't allow removing required categories
    const requiredCategories = [
      "Languages",
      "Frameworks and Libraries",
      "Development Tools",
    ];
    if (requiredCategories.includes(category)) {
      return;
    }

    setSkillsObject((prev) => {
      const newObj = { ...prev };
      delete newObj[category];
      return newObj;
    });
  };

  // Projects helpers
  const addProject = () => {
    const newProject: Project = {
      id: generateId(),
      name: "",
      techStack: [],
      description: [],
    };
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
  };

  const removeProject = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id),
    }));
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id ? { ...proj, [field]: value } : proj
      ),
    }));
  };

  const addProjectTech = (projId: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === projId
          ? { ...proj, techStack: [...(Array.isArray(proj.techStack) ? proj.techStack : []), ""] }
          : proj
      ),
    }));
  };

  const removeProjectTech = (projId: string, techIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === projId
          ? {
              ...proj,
              techStack: (Array.isArray(proj.techStack) ? proj.techStack : []).filter((_, i) => i !== techIndex),
            }
          : proj
      ),
    }));
  };

  const updateProjectTech = (projId: string, techIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === projId
          ? {
              ...proj,
              techStack: (Array.isArray(proj.techStack) ? proj.techStack : []).map((tech, i) =>
                i === techIndex ? value : tech
              ),
            }
          : proj
      ),
    }));
  };

  const addProjectBullet = (projId: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === projId
          ? { ...proj, description: [...(Array.isArray(proj.description) ? proj.description : []), ""] }
          : proj
      ),
    }));
  };

  const removeProjectBullet = (projId: string, bulletIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === projId
          ? {
              ...proj,
              description: (Array.isArray(proj.description) ? proj.description : []).filter((_, i) => i !== bulletIndex),
            }
          : proj
      ),
    }));
  };

  const updateProjectBullet = (projId: string, bulletIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === projId
          ? {
              ...proj,
              description: (Array.isArray(proj.description) ? proj.description : []).map((bullet, i) =>
                i === bulletIndex ? value : bullet
              ),
            }
          : proj
      ),
    }));
  };

  // Certifications helpers
  const addCertification = () => {
    const newCert: Certification = {
      id: generateId(),
      name: "",
      issuer: "",
      date: "",
      expiryDate: "",
      credentialId: "",
      url: "",
    };
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, newCert],
    }));
  };

  const removeCertification = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((cert) => cert.id !== id),
    }));
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert
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

          {/* Education Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Education</h2>
              <Button
                onClick={addEducation}
                className="bg-violet-500 text-white hover:bg-violet-600"
              >
                + Add Education
              </Button>
            </div>

            {formData.education.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No education entries added yet. Click "Add Education" to get started.
              </p>
            ) : (
              <div className="space-y-6">
                {formData.education.map((edu, index) => (
                  <div
                    key={edu.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Education #{index + 1}
                      </h3>
                      <Button
                        onClick={() => removeEducation(edu.id)}
                        className="bg-red-500 text-white hover:bg-red-600 text-sm"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          School/University <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) =>
                            updateEducation(edu.id, "school", e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Degree <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) =>
                            updateEducation(edu.id, "degree", e.target.value)
                          }
                          placeholder="e.g., Bachelor's, Master's, PhD"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field of Study <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.field}
                          onChange={(e) =>
                            updateEducation(edu.id, "field", e.target.value)
                          }
                          placeholder="e.g., Computer Science"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) =>
                            updateEducation(edu.id, "location", e.target.value)
                          }
                          placeholder="e.g., New York, NY"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Graduation Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.graduationDate}
                          onChange={(e) =>
                            updateEducation(edu.id, "graduationDate", e.target.value)
                          }
                          placeholder="e.g., May 2025"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GPA (Optional)
                        </label>
                        <input
                          type="text"
                          value={edu.gpa || ""}
                          onChange={(e) =>
                            updateEducation(edu.id, "gpa", e.target.value)
                          }
                          placeholder="e.g., 3.8/4.0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Academic Achievements/Honors */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Academic Achievements/Honors (Optional)
                        </label>
                        <Button
                          onClick={() => addEducationHonor(edu.id)}
                          className="bg-violet-500 text-white hover:bg-violet-600 text-sm"
                        >
                          + Add Honor
                        </Button>
                      </div>
                      {(!edu.academicAchievements || edu.academicAchievements.length === 0) ? (
                        <p className="text-gray-500 text-sm py-2">
                          No honors added yet. Click "Add Honor" to add achievements.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {edu.academicAchievements.map((honor, honorIndex) => (
                            <div key={honorIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={honor}
                                onChange={(e) =>
                                  updateEducationHonor(edu.id, honorIndex, e.target.value)
                                }
                                placeholder="e.g., Dean's List, Magna Cum Laude"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                              />
                              <Button
                                onClick={() => removeEducationHonor(edu.id, honorIndex)}
                                className="bg-red-500 text-white hover:bg-red-600 text-sm"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Technical Skills</h2>
              <Button
                onClick={addCustomSkillCategory}
                className="bg-violet-500 text-white hover:bg-violet-600"
              >
                + Add Category
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(skillsObject).map(([category, skills]) => (
                <div
                  key={category}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {category}
                      {["Languages", "Frameworks and Libraries", "Development Tools"].includes(
                        category
                      ) && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {!["Languages", "Frameworks and Libraries", "Development Tools"].includes(
                      category
                    ) && (
                      <Button
                        onClick={() => removeSkillCategory(category)}
                        className="bg-red-500 text-white hover:bg-red-600 text-sm"
                      >
                        Remove Category
                      </Button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => updateSkillCategory(category, e.target.value)}
                    placeholder="e.g., Python, JavaScript, C#, Java (comma-separated)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required={
                      ["Languages", "Frameworks and Libraries", "Development Tools"].includes(
                        category
                      )
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter skills separated by commas
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Projects Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
              <Button
                onClick={addProject}
                className="bg-violet-500 text-white hover:bg-violet-600"
              >
                + Add Project
              </Button>
            </div>

            {formData.projects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No projects added yet. Click "Add Project" to get started.
              </p>
            ) : (
              <div className="space-y-6">
                {formData.projects.map((proj, index) => (
                  <div
                    key={proj.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Project #{index + 1}
                      </h3>
                      <Button
                        onClick={() => removeProject(proj.id)}
                        className="bg-red-500 text-white hover:bg-red-600 text-sm"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Project Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) =>
                            updateProject(proj.id, "name", e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Technologies */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Technologies
                          </label>
                          <Button
                            onClick={() => addProjectTech(proj.id)}
                            className="bg-violet-500 text-white hover:bg-violet-600 text-sm"
                          >
                            + Add Technology
                          </Button>
                        </div>
                        {(!Array.isArray(proj.techStack) || proj.techStack.length === 0) ? (
                          <p className="text-gray-500 text-sm py-2">
                            No technologies added yet. Click "Add Technology" to add.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {proj.techStack.map((tech, techIndex) => (
                              <div key={techIndex} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={tech}
                                  onChange={(e) =>
                                    updateProjectTech(proj.id, techIndex, e.target.value)
                                  }
                                  placeholder="e.g., React, Python, AWS"
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                />
                                <Button
                                  onClick={() => removeProjectTech(proj.id, techIndex)}
                                  className="bg-red-500 text-white hover:bg-red-600 text-sm"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Description/Bullet Points */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Description/Bullet Points
                          </label>
                          <Button
                            onClick={() => addProjectBullet(proj.id)}
                            className="bg-violet-500 text-white hover:bg-violet-600 text-sm"
                          >
                            + Add Bullet
                          </Button>
                        </div>
                        {(!Array.isArray(proj.description) || proj.description.length === 0) ? (
                          <p className="text-gray-500 text-sm py-2">
                            No bullet points yet. Click "Add Bullet" to add descriptions.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {(Array.isArray(proj.description) ? proj.description : []).map((bullet, bulletIndex) => (
                              <div key={bulletIndex} className="flex items-start gap-2">
                                <span className="text-gray-500 mt-2">•</span>
                                <textarea
                                  value={bullet}
                                  onChange={(e) =>
                                    updateProjectBullet(proj.id, bulletIndex, e.target.value)
                                  }
                                  placeholder="Enter bullet point (supports **bold** markdown)"
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y min-h-[60px]"
                                />
                                <Button
                                  onClick={() => removeProjectBullet(proj.id, bulletIndex)}
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications Section (Optional) */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
                <p className="text-sm text-gray-500 mt-1">(Optional)</p>
              </div>
              <Button
                onClick={addCertification}
                className="bg-violet-500 text-white hover:bg-violet-600"
              >
                + Add Certification
              </Button>
            </div>

            {formData.certifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No certifications added yet. Click "Add Certification" to get started.
              </p>
            ) : (
              <div className="space-y-6">
                {formData.certifications.map((cert, index) => (
                  <div
                    key={cert.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Certification #{index + 1}
                      </h3>
                      <Button
                        onClick={() => removeCertification(cert.id)}
                        className="bg-red-500 text-white hover:bg-red-600 text-sm"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Certification Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) =>
                            updateCertification(cert.id, "name", e.target.value)
                          }
                          placeholder="e.g., AWS Certified Solutions Architect"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Issuer <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) =>
                            updateCertification(cert.id, "issuer", e.target.value)
                          }
                          placeholder="e.g., Amazon Web Services"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cert.date}
                          onChange={(e) =>
                            updateCertification(cert.id, "date", e.target.value)
                          }
                          placeholder="e.g., Jan 2024"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date (Optional)
                        </label>
                        <input
                          type="text"
                          value={cert.expiryDate || ""}
                          onChange={(e) =>
                            updateCertification(cert.id, "expiryDate", e.target.value)
                          }
                          placeholder="e.g., Jan 2027"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Credential ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={cert.credentialId || ""}
                          onChange={(e) =>
                            updateCertification(cert.id, "credentialId", e.target.value)
                          }
                          placeholder="e.g., ABC123"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={cert.url || ""}
                          onChange={(e) =>
                            updateCertification(cert.id, "url", e.target.value)
                          }
                          placeholder="https://..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
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
