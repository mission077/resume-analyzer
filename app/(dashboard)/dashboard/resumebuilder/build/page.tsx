"use client";

import { SubHeader } from "@/components/subHeader";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ResumeData, PersonalInfo, Education, Experience, Project, Skill, Certification } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { SectionFeedback } from "@/services/analysis/resumeAnalyzer";

// Extracurricular interface (not in types.ts yet)
interface Extracurricular {
  id: string;
  title: string;
  organization: string;
  role: string;
  startDate: string; // Format: "Month Year"
  endDate: string | null; // Format: "Month Year", null if current
  isCurrent: boolean;
  description: string; // Optional description text
  bullets: string[]; // Array of bullet points, supports **bold** markdown
  type: "leadership" | "volunteer" | "club" | "sports" | "other";
}

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
  const [hasRestoredFromPreview, setHasRestoredFromPreview] = useState(false);
  
  // Ref to track if component is mounted (for async operations)
  const isMountedRef = useRef(true);
  
  // Section feedback state
  const [sectionFeedback, setSectionFeedback] = useState<SectionFeedback[]>([]);
  
  // Skills object state (must be declared before useEffect that uses setSkillsObject)
  const [skillsObject, setSkillsObject] = useState<Record<string, string>>({
    Languages: "",
    "Frameworks and Libraries": "",
    "Development Tools": "",
  });

  // SCENARIO 1: Restore from preview (runs ONCE on mount, highest priority)
  useEffect(() => {
    console.log("🔍 Checking for saved form data in sessionStorage...");
    
    // Check if user is creating a NEW resume (no analysisId and no restore flag)
    const restoreFromPreviewFlag = sessionStorage.getItem("restoreFromPreview");
    const shouldRestoreFromPreview = !!restoreFromPreviewFlag; // Store as boolean before removing
    const hasAnalysisId = !!analysisId;
    
    // Clear the restore flag immediately (so it doesn't persist across page loads)
    if (restoreFromPreviewFlag) {
      sessionStorage.removeItem("restoreFromPreview");
    }
    
    // If creating new resume (no analysisId AND not from preview), clear old data
    if (!hasAnalysisId && !shouldRestoreFromPreview) {
      console.log("🧹 Creating new resume - clearing old sessionStorage data");
      sessionStorage.removeItem("resumePreviewData");
      sessionStorage.removeItem("resumeBuilderFormData");
      sessionStorage.removeItem("resumeBuilderTitle");
      sessionStorage.removeItem("resumeBuilderSkills");
      console.log("✅ Old data cleared - form will be empty");
      return; // Exit early - form stays empty
    }
    
    let savedFormData: string | null = null;
    let savedResumeTitle: string | null = null;
    let savedSkillsObject: string | null = null;
    
    // PRIORITY 1: Check previewData FIRST (most reliable - contains everything)
    // Only restore if we have the restore flag OR if we have an analysisId
    const previewDataStr = sessionStorage.getItem("resumePreviewData");
    if (previewDataStr && (shouldRestoreFromPreview || hasAnalysisId)) {
      try {
        const previewData = JSON.parse(previewDataStr);
        if (previewData.resumeData) {
          console.log("✅ [PRIORITY 1] Found form data in previewData, extracting...");
          // Extract form data from previewData
          savedFormData = JSON.stringify({
            personalInfo: previewData.resumeData.personalInfo,
            education: previewData.resumeData.education,
            experiences: previewData.resumeData.experiences,
            projects: previewData.resumeData.projects,
            certifications: previewData.resumeData.certifications || [],
            extracurriculars: previewData.resumeData.extracurriculars || [],
          });
          savedResumeTitle = previewData.resumeData.title || "";
          savedSkillsObject = JSON.stringify(previewData.resumeData.skills || {});
          console.log("✅ [PRIORITY 1] Extracted form data from previewData successfully");
        }
      } catch (err) {
        console.error("❌ Error parsing previewData:", err);
      }
    }
    
    // PRIORITY 2: Fallback to direct form data keys (if previewData not found)
    if (!savedFormData || !savedResumeTitle) {
      console.log("🔍 [PRIORITY 2] previewData not found, checking direct keys...");
      savedFormData = sessionStorage.getItem("resumeBuilderFormData");
      savedResumeTitle = sessionStorage.getItem("resumeBuilderTitle");
      savedSkillsObject = sessionStorage.getItem("resumeBuilderSkills");
      if (savedFormData && savedResumeTitle) {
        console.log("✅ [PRIORITY 2] Found form data in direct keys");
      }
    }
    
    console.log("📦 Saved data check:", {
      hasFormData: !!savedFormData,
      hasTitle: !!savedResumeTitle,
      hasSkills: !!savedSkillsObject,
    });
    
    if (savedFormData && savedResumeTitle) {
      try {
        console.log("🔄 SCENARIO 1: Restoring form data from preview - preserving user's changes");
        const parsedFormData = JSON.parse(savedFormData);
        setFormData(parsedFormData);
        setResumeTitle(savedResumeTitle);
        
        if (savedSkillsObject) {
          const parsedSkills = JSON.parse(savedSkillsObject);
          setSkillsObject(parsedSkills);
        }
        
        setHasRestoredFromPreview(true);
        console.log("✅ Form data restored - user's changes preserved");
      } catch (err) {
        console.error("❌ Error restoring form data:", err);
        // Clear corrupted data
        sessionStorage.removeItem("resumeBuilderFormData");
        sessionStorage.removeItem("resumeBuilderTitle");
        sessionStorage.removeItem("resumeBuilderSkills");
        setHasRestoredFromPreview(false);
      }
    } else {
      console.log("ℹ️ No saved form data found - will proceed with analysis pre-fill or empty form");
      setHasRestoredFromPreview(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONLY once on mount

  // SCENARIO 2 & 3: Pre-fill from analysis OR empty form (only if NOT restored from preview)
  useEffect(() => {
    // CRITICAL: Check sessionStorage directly (not state) to prevent race condition
    const savedFormData = sessionStorage.getItem("resumeBuilderFormData");
    const savedResumeTitle = sessionStorage.getItem("resumeBuilderTitle");
    
    if (savedFormData && savedResumeTitle) {
      console.log("⏭️ Skipping analysis pre-fill - form was restored from preview");
      return;
    }

    async function prefillFromAnalysis() {
      if (!analysisId) {
        // SCENARIO 3: No analysisId and no saved data = Manual entry
        // Clear any old pre-fill data from localStorage
        localStorage.removeItem("resumeBuilderPrefillData");
        localStorage.removeItem("resumeBuilderAnalysisId");
        console.log("🆕 SCENARIO 3: Creating new resume from scratch - form is empty");
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

        // Extract section_feedback from analysis.analysis.section_feedback
        let extractedSectionFeedback: SectionFeedback[] = [];
        if (analysis.analysis && typeof analysis.analysis === 'object') {
          const parsedAnalysis = typeof analysis.analysis === 'string' 
            ? JSON.parse(analysis.analysis) 
            : analysis.analysis;
          
          if (Array.isArray(parsedAnalysis.section_feedback)) {
            extractedSectionFeedback = parsedAnalysis.section_feedback.filter(
              (sf: any) => 
                sf && 
                typeof sf.section === 'string' && 
                ['education', 'experiences', 'projects', 'skills', 'certifications', 'extracurriculars', 'personalInfo'].includes(sf.section) &&
                typeof sf.status === 'string' && 
                ['alert', 'warning', 'safe'].includes(sf.status)
            ).map((sf: any) => ({
              section: sf.section as SectionFeedback['section'],
              status: sf.status as SectionFeedback['status'],
              feedback: typeof sf.feedback === 'string' ? sf.feedback : '',
              hints: Array.isArray(sf.hints) ? sf.hints.filter((h: any) => typeof h === 'string') : []
            }));
            console.log("✅ Extracted section_feedback:", extractedSectionFeedback);
          }
        }
        setSectionFeedback(extractedSectionFeedback);

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
        
        // Normalize data to ensure arrays are always initialized and strings are never undefined
        const normalizedData: ResumeData = {
          ...parsedData,
          personalInfo: {
            firstName: parsedData.personalInfo?.firstName || "",
            lastName: parsedData.personalInfo?.lastName || "",
            email: parsedData.personalInfo?.email || "",
            phone: parsedData.personalInfo?.phone || "",
            linkedin: parsedData.personalInfo?.linkedin || "",
            github: parsedData.personalInfo?.github || "",
            website: parsedData.personalInfo?.website || "",
          },
          projects: parsedData.projects?.map((proj) => ({
            ...proj,
            name: proj.name || "",
            techStack: Array.isArray(proj.techStack) ? proj.techStack : [],
            description: Array.isArray(proj.description) 
              ? proj.description 
              : typeof proj.description === 'string' 
                ? [proj.description] 
                : [],
          })) || [],
          experiences: parsedData.experiences?.map((exp) => ({
            ...exp,
            company: exp.company || "",
            role: exp.role || "",
            location: exp.location || "",
            startDate: exp.startDate || "",
            endDate: exp.endDate || null,
            description: Array.isArray(exp.description) 
              ? exp.description 
              : typeof exp.description === 'string' 
                ? [exp.description] 
                : [],
            type: exp.type || "job",
          })) || [],
          education: parsedData.education?.map((edu) => ({
            ...edu,
            school: edu.school || "",
            degree: edu.degree || "",
            field: edu.field || "",
            location: edu.location || "",
            graduationDate: edu.graduationDate || "",
            gpa: edu.gpa || "",
            academicAchievements: Array.isArray(edu.academicAchievements) 
              ? edu.academicAchievements 
              : [],
          })) || [],
          certifications: parsedData.certifications?.map((cert) => ({
            ...cert,
            name: cert.name || "",
            issuer: cert.issuer || "",
            date: cert.date || "",
            expiryDate: cert.expiryDate || "",
            credentialId: cert.credentialId || "",
            url: cert.url || "",
          })) || [],
          extracurriculars: Array.isArray(parsedData.extracurriculars)
            ? parsedData.extracurriculars.map((extra: any) => ({
                ...extra,
                title: extra.title || "",
                organization: extra.organization || "",
                role: extra.role || "",
                startDate: extra.startDate || "",
                endDate: extra.endDate || null,
                description: extra.description || "",
                bullets: Array.isArray(extra.bullets) ? extra.bullets : [],
                type: extra.type || "leadership",
              }))
            : [],
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

    // Run analysis pre-fill (SCENARIO 2) - only if we didn't restore from preview
    prefillFromAnalysis();
  }, [analysisId]); // Only depend on analysisId, not hasRestoredFromPreview

  // Cleanup: mark component as unmounted when it unmounts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  // Extracurriculars helpers
  const addExtracurricular = () => {
    const newExtra: Extracurricular = {
      id: generateId(),
      title: "",
      organization: "",
      role: "",
      startDate: "",
      endDate: null,
      isCurrent: false,
      description: "",
      bullets: [],
      type: "leadership",
    };
    setFormData((prev) => ({
      ...prev,
      extracurriculars: [...(prev.extracurriculars || []), newExtra],
    }));
  };

  const removeExtracurricular = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      extracurriculars: (prev.extracurriculars || []).filter((extra) => extra.id !== id),
    }));
  };

  const updateExtracurricular = (id: string, field: keyof Extracurricular, value: any) => {
    setFormData((prev) => ({
      ...prev,
      extracurriculars: (prev.extracurriculars || []).map((extra) =>
        extra.id === id ? { ...extra, [field]: value } : extra
      ),
    }));
  };

  const addExtracurricularBullet = (extraId: string) => {
    setFormData((prev) => ({
      ...prev,
      extracurriculars: (prev.extracurriculars || []).map((extra) =>
        extra.id === extraId
          ? { ...extra, bullets: [...(extra.bullets || []), ""] }
          : extra
      ),
    }));
  };

  const removeExtracurricularBullet = (extraId: string, bulletIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      extracurriculars: (prev.extracurriculars || []).map((extra) =>
        extra.id === extraId
          ? {
              ...extra,
              bullets: (extra.bullets || []).filter((_, i) => i !== bulletIndex),
            }
          : extra
      ),
    }));
  };

  const updateExtracurricularBullet = (extraId: string, bulletIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      extracurriculars: (prev.extracurriculars || []).map((extra) =>
        extra.id === extraId
          ? {
              ...extra,
              bullets: (extra.bullets || []).map((bullet, i) =>
                i === bulletIndex ? value : bullet
              ),
            }
          : extra
      ),
    }));
  };

  // Helper to get feedback for a section
  const getFeedbackForSection = (section: SectionFeedback['section']): SectionFeedback | null => {
    return sectionFeedback.find(sf => sf.section === section && (sf.status === 'alert' || sf.status === 'warning')) || null;
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
          <div 
            className={`rounded-lg shadow-md border-2 p-6 mb-6 relative group bg-white ${
              !isPrefilling && getFeedbackForSection('personalInfo')?.status === 'alert' 
                ? 'border-red-500' 
                : !isPrefilling && getFeedbackForSection('personalInfo')?.status === 'warning'
                ? 'border-yellow-500'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Personal Information
              </h2>
              {!isPrefilling && getFeedbackForSection('personalInfo') && (
                <div className="relative group/icon">
                  <svg 
                    className="w-5 h-5 text-gray-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  
                  {/* Hover Tooltip - appears from question mark icon */}
                  <div className={`absolute left-0 bottom-full mb-2 w-[600px] max-h-[400px] overflow-y-auto bg-white border-2 rounded-lg shadow-xl p-5 z-50 opacity-0 pointer-events-none transition-opacity duration-200 group-hover/icon:opacity-100 ${
                    getFeedbackForSection('personalInfo')?.status === 'alert' 
                      ? 'border-red-500' 
                      : 'border-yellow-500'
                  }`}>
                    <div className={`absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 transform rotate-45 ${
                      getFeedbackForSection('personalInfo')?.status === 'alert' 
                        ? 'border-red-500' 
                        : 'border-yellow-500'
                    }`}></div>
                    <div className="relative">
                      <p className="font-semibold mb-2 text-gray-900">{getFeedbackForSection('personalInfo')?.feedback}</p>
                      {getFeedbackForSection('personalInfo')?.hints && getFeedbackForSection('personalInfo')!.hints.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <p className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-700">Questions to Consider:</p>
                          <ul className="space-y-2">
                            {getFeedbackForSection('personalInfo')!.hints.map((hint, index) => (
                              <li key={index} className="text-sm leading-relaxed text-gray-700">
                                • {hint}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.personalInfo.firstName || ""}
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
                  value={formData.personalInfo.lastName || ""}
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
                  value={formData.personalInfo.email || ""}
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
                  value={formData.personalInfo.phone || ""}
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
          <div 
            className={`rounded-lg shadow-md border-2 p-6 mb-6 relative group bg-white ${
              !isPrefilling && getFeedbackForSection('experiences')?.status === 'alert' 
                ? 'border-red-500' 
                : !isPrefilling && getFeedbackForSection('experiences')?.status === 'warning'
                ? 'border-yellow-500'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Experience</h2>
                {!isPrefilling && getFeedbackForSection('experiences') && (
                  <div className="relative group/icon">
                    <svg 
                      className="w-5 h-5 text-gray-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    
                    {/* Hover Tooltip - appears from question mark icon */}
                    <div className={`absolute left-0 bottom-full mb-2 w-[600px] max-h-[400px] overflow-y-auto bg-white border-2 rounded-lg shadow-xl p-5 z-50 opacity-0 pointer-events-none transition-opacity duration-200 group-hover/icon:opacity-100 ${
                      getFeedbackForSection('experiences')?.status === 'alert' 
                        ? 'border-red-500' 
                        : 'border-yellow-500'
                    }`}>
                      <div className={`absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 transform rotate-45 ${
                        getFeedbackForSection('experiences')?.status === 'alert' 
                          ? 'border-red-500' 
                          : 'border-yellow-500'
                      }`}></div>
                      <div className="relative">
                        <p className="font-semibold mb-2 text-gray-900">{getFeedbackForSection('experiences')?.feedback}</p>
                        {getFeedbackForSection('experiences')?.hints && getFeedbackForSection('experiences')!.hints.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-700">Questions to Consider:</p>
                            <ul className="space-y-2">
                              {getFeedbackForSection('experiences')!.hints.map((hint, index) => (
                                <li key={index} className="text-sm leading-relaxed text-gray-700">
                                  • {hint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                          value={exp.company || ""}
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
                          value={exp.role || ""}
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
                          value={exp.location || ""}
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
                          value={exp.startDate || ""}
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
          <div 
            className={`rounded-lg shadow-md border-2 p-6 mb-6 relative group bg-white ${
              !isPrefilling && getFeedbackForSection('education')?.status === 'alert' 
                ? 'border-red-500' 
                : !isPrefilling && getFeedbackForSection('education')?.status === 'warning'
                ? 'border-yellow-500'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Education</h2>
                {!isPrefilling && getFeedbackForSection('education') && (
                  <div className="relative group/icon">
                    <svg 
                      className="w-5 h-5 text-gray-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    
                    {/* Hover Tooltip - appears from question mark icon */}
                    <div className={`absolute left-0 bottom-full mb-2 w-[600px] max-h-[400px] overflow-y-auto bg-white border-2 rounded-lg shadow-xl p-5 z-50 opacity-0 pointer-events-none transition-opacity duration-200 group-hover/icon:opacity-100 ${
                      getFeedbackForSection('education')?.status === 'alert' 
                        ? 'border-red-500' 
                        : 'border-yellow-500'
                    }`}>
                      <div className={`absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 transform rotate-45 ${
                        getFeedbackForSection('education')?.status === 'alert' 
                          ? 'border-red-500' 
                          : 'border-yellow-500'
                      }`}></div>
                      <div className="relative">
                        <p className="font-semibold mb-2 text-gray-900">{getFeedbackForSection('education')?.feedback}</p>
                        {getFeedbackForSection('education')?.hints && getFeedbackForSection('education')!.hints.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-700">Questions to Consider:</p>
                            <ul className="space-y-2">
                              {getFeedbackForSection('education')!.hints.map((hint, index) => (
                                <li key={index} className="text-sm leading-relaxed text-gray-700">
                                  • {hint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                          value={edu.school || ""}
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
                          value={edu.degree || ""}
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
                          value={edu.field || ""}
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
                          value={edu.location || ""}
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
                          value={edu.graduationDate || ""}
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
          <div 
            className={`rounded-lg shadow-md border-2 p-6 mb-6 relative group bg-white ${
              !isPrefilling && getFeedbackForSection('skills')?.status === 'alert' 
                ? 'border-red-500' 
                : !isPrefilling && getFeedbackForSection('skills')?.status === 'warning'
                ? 'border-yellow-500'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Technical Skills</h2>
                {!isPrefilling && getFeedbackForSection('skills') && (
                  <div className="relative group/icon">
                    <svg 
                      className="w-5 h-5 text-gray-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    
                    {/* Hover Tooltip - appears from question mark icon */}
                    <div className={`absolute left-0 bottom-full mb-2 w-[600px] max-h-[400px] overflow-y-auto bg-white border-2 rounded-lg shadow-xl p-5 z-50 opacity-0 pointer-events-none transition-opacity duration-200 group-hover/icon:opacity-100 ${
                      getFeedbackForSection('skills')?.status === 'alert' 
                        ? 'border-red-500' 
                        : 'border-yellow-500'
                    }`}>
                      <div className={`absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 transform rotate-45 ${
                        getFeedbackForSection('skills')?.status === 'alert' 
                          ? 'border-red-500' 
                          : 'border-yellow-500'
                      }`}></div>
                      <div className="relative">
                        <p className="font-semibold mb-2 text-gray-900">{getFeedbackForSection('skills')?.feedback}</p>
                        {getFeedbackForSection('skills')?.hints && getFeedbackForSection('skills')!.hints.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-700">Questions to Consider:</p>
                            <ul className="space-y-2">
                              {getFeedbackForSection('skills')!.hints.map((hint, index) => (
                                <li key={index} className="text-sm leading-relaxed text-gray-700">
                                  • {hint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
          <div 
            className={`rounded-lg shadow-md border-2 p-6 mb-6 relative group bg-white ${
              !isPrefilling && getFeedbackForSection('projects')?.status === 'alert' 
                ? 'border-red-500' 
                : !isPrefilling && getFeedbackForSection('projects')?.status === 'warning'
                ? 'border-yellow-500'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
                {!isPrefilling && getFeedbackForSection('projects') && (
                  <div className="relative group/icon">
                    <svg 
                      className="w-5 h-5 text-gray-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    
                    {/* Hover Tooltip - appears from question mark icon */}
                    <div className={`absolute left-0 bottom-full mb-2 w-[600px] max-h-[400px] overflow-y-auto bg-white border-2 rounded-lg shadow-xl p-5 z-50 opacity-0 pointer-events-none transition-opacity duration-200 group-hover/icon:opacity-100 ${
                      getFeedbackForSection('projects')?.status === 'alert' 
                        ? 'border-red-500' 
                        : 'border-yellow-500'
                    }`}>
                      <div className={`absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 transform rotate-45 ${
                        getFeedbackForSection('projects')?.status === 'alert' 
                          ? 'border-red-500' 
                          : 'border-yellow-500'
                      }`}></div>
                      <div className="relative">
                        <p className="font-semibold mb-2 text-gray-900">{getFeedbackForSection('projects')?.feedback}</p>
                        {getFeedbackForSection('projects')?.hints && getFeedbackForSection('projects')!.hints.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-700">Questions to Consider:</p>
                            <ul className="space-y-2">
                              {getFeedbackForSection('projects')!.hints.map((hint, index) => (
                                <li key={index} className="text-sm leading-relaxed text-gray-700">
                                  • {hint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                          value={proj.name || ""}
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
          <div 
            className={`rounded-lg shadow-md border-2 p-6 mb-6 relative group bg-white ${
              !isPrefilling && getFeedbackForSection('certifications')?.status === 'alert' 
                ? 'border-red-500' 
                : !isPrefilling && getFeedbackForSection('certifications')?.status === 'warning'
                ? 'border-yellow-500'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
                  <p className="text-sm text-gray-500 mt-1">(Optional)</p>
                </div>
                {!isPrefilling && getFeedbackForSection('certifications') && (
                  <div className="relative group/icon">
                    <svg 
                      className="w-5 h-5 text-gray-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    
                    {/* Hover Tooltip - appears from question mark icon */}
                    <div className={`absolute left-0 bottom-full mb-2 w-[600px] max-h-[400px] overflow-y-auto bg-white border-2 rounded-lg shadow-xl p-5 z-50 opacity-0 pointer-events-none transition-opacity duration-200 group-hover/icon:opacity-100 ${
                      getFeedbackForSection('certifications')?.status === 'alert' 
                        ? 'border-red-500' 
                        : 'border-yellow-500'
                    }`}>
                      <div className={`absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 transform rotate-45 ${
                        getFeedbackForSection('certifications')?.status === 'alert' 
                          ? 'border-red-500' 
                          : 'border-yellow-500'
                      }`}></div>
                      <div className="relative">
                        <p className="font-semibold mb-2 text-gray-900">{getFeedbackForSection('certifications')?.feedback}</p>
                        {getFeedbackForSection('certifications')?.hints && getFeedbackForSection('certifications')!.hints.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-700">Questions to Consider:</p>
                            <ul className="space-y-2">
                              {getFeedbackForSection('certifications')!.hints.map((hint, index) => (
                                <li key={index} className="text-sm leading-relaxed text-gray-700">
                                  • {hint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                          value={cert.name || ""}
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
                          value={cert.issuer || ""}
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
                          value={cert.date || ""}
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

          {/* Extracurriculars Section (Optional) */}
          <div 
            className={`rounded-lg shadow-md border-2 p-6 mb-6 relative group bg-white ${
              !isPrefilling && getFeedbackForSection('extracurriculars')?.status === 'alert' 
                ? 'border-red-500' 
                : !isPrefilling && getFeedbackForSection('extracurriculars')?.status === 'warning'
                ? 'border-yellow-500'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Extracurriculars</h2>
                  <p className="text-sm text-gray-500 mt-1">(Optional)</p>
                </div>
                {!isPrefilling && getFeedbackForSection('extracurriculars') && (
                  <div className="relative group/icon">
                    <svg 
                      className="w-5 h-5 text-gray-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    
                    {/* Hover Tooltip - appears from question mark icon */}
                    <div className={`absolute left-0 bottom-full mb-2 w-[600px] max-h-[400px] overflow-y-auto bg-white border-2 rounded-lg shadow-xl p-5 z-50 opacity-0 pointer-events-none transition-opacity duration-200 group-hover/icon:opacity-100 ${
                      getFeedbackForSection('extracurriculars')?.status === 'alert' 
                        ? 'border-red-500' 
                        : 'border-yellow-500'
                    }`}>
                      <div className={`absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 transform rotate-45 ${
                        getFeedbackForSection('extracurriculars')?.status === 'alert' 
                          ? 'border-red-500' 
                          : 'border-yellow-500'
                      }`}></div>
                      <div className="relative">
                        <p className="font-semibold mb-2 text-gray-900">{getFeedbackForSection('extracurriculars')?.feedback}</p>
                        {getFeedbackForSection('extracurriculars')?.hints && getFeedbackForSection('extracurriculars')!.hints.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-700">Questions to Consider:</p>
                            <ul className="space-y-2">
                              {getFeedbackForSection('extracurriculars')!.hints.map((hint, index) => (
                                <li key={index} className="text-sm leading-relaxed text-gray-700">
                                  • {hint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={addExtracurricular}
                className="bg-violet-500 text-white hover:bg-violet-600"
              >
                + Add Extracurricular
              </Button>
            </div>

            {(!formData.extracurriculars || formData.extracurriculars.length === 0) ? (
              <p className="text-gray-500 text-center py-4">
                No extracurriculars added yet. Click "Add Extracurricular" to get started.
              </p>
            ) : (
              <div className="space-y-6">
                {(formData.extracurriculars as Extracurricular[]).map((extra, index) => (
                  <div
                    key={extra.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Extracurricular #{index + 1}
                      </h3>
                      <Button
                        onClick={() => removeExtracurricular(extra.id)}
                        className="bg-red-500 text-white hover:bg-red-600 text-sm"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={extra.title || ""}
                          onChange={(e) =>
                            updateExtracurricular(extra.id, "title", e.target.value)
                          }
                          placeholder="e.g., Student Council President"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={extra.organization || ""}
                          onChange={(e) =>
                            updateExtracurricular(extra.id, "organization", e.target.value)
                          }
                          placeholder="e.g., University Student Council"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={extra.role || ""}
                          onChange={(e) =>
                            updateExtracurricular(extra.id, "role", e.target.value)
                          }
                          placeholder="e.g., President, Member, Volunteer"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <select
                          value={extra.type || "leadership"}
                          onChange={(e) =>
                            updateExtracurricular(
                              extra.id,
                              "type",
                              e.target.value as Extracurricular["type"]
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        >
                          <option value="leadership">Leadership</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="club">Club</option>
                          <option value="sports">Sports</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={extra.startDate || ""}
                          onChange={(e) =>
                            updateExtracurricular(extra.id, "startDate", e.target.value)
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
                            value={extra.endDate || ""}
                            onChange={(e) =>
                              updateExtracurricular(
                                extra.id,
                                "endDate",
                                e.target.value || null
                              )
                            }
                            placeholder="e.g., Dec 2024"
                            disabled={extra.isCurrent}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <label className="flex items-center gap-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={extra.isCurrent}
                              onChange={(e) => {
                                updateExtracurricular(extra.id, "isCurrent", e.target.checked);
                                if (e.target.checked) {
                                  updateExtracurricular(extra.id, "endDate", null);
                                }
                              }}
                              className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-sm text-gray-700">Current</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={extra.description || ""}
                        onChange={(e) =>
                          updateExtracurricular(extra.id, "description", e.target.value)
                        }
                        placeholder="Brief description of the activity"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y min-h-[80px]"
                      />
                    </div>

                    {/* Bullet Points */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Bullet Points (Optional)
                        </label>
                        <Button
                          onClick={() => addExtracurricularBullet(extra.id)}
                          className="bg-violet-500 text-white hover:bg-violet-600 text-sm"
                        >
                          + Add Bullet
                        </Button>
                      </div>
                      {(!extra.bullets || extra.bullets.length === 0) ? (
                        <p className="text-gray-500 text-sm py-2">
                          No bullet points yet. Click "Add Bullet" to add achievements.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {extra.bullets.map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex items-start gap-2">
                              <span className="text-gray-500 mt-2">•</span>
                              <textarea
                                value={bullet}
                                onChange={(e) =>
                                  updateExtracurricularBullet(extra.id, bulletIndex, e.target.value)
                                }
                                placeholder="Enter bullet point (supports **bold** markdown)"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y min-h-[60px]"
                              />
                              <Button
                                onClick={() => removeExtracurricularBullet(extra.id, bulletIndex)}
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
              onClick={() => {
                // Clear saved form data when canceling
                sessionStorage.removeItem("resumeBuilderFormData");
                sessionStorage.removeItem("resumeBuilderTitle");
                sessionStorage.removeItem("resumeBuilderSkills");
                sessionStorage.removeItem("resumePreviewData");
                router.push("/dashboard");
              }}
              className="bg-gray-500 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  
                  // Validate required fields
                  if (!resumeTitle || !formData.personalInfo.firstName || !formData.personalInfo.lastName) {
                    alert("Please fill in required fields: Resume Title, First Name, and Last Name");
                    return;
                  }

                  // Save form data IMMEDIATELY (before any async operations) so it's definitely saved
                  console.log("💾 [STEP 1] Saving form data to sessionStorage BEFORE PDF generation...");
                  try {
                    sessionStorage.setItem("resumeBuilderFormData", JSON.stringify(formData));
                    sessionStorage.setItem("resumeBuilderTitle", resumeTitle);
                    sessionStorage.setItem("resumeBuilderSkills", JSON.stringify(skillsObject));
                    console.log("✅ [STEP 1] Form data saved to sessionStorage successfully");
                  } catch (saveError) {
                    console.error("❌ [STEP 1] Error saving form data:", saveError);
                    // Don't throw - continue with PDF generation even if save fails
                  }

                  // Generate PDF via LaTeX service
                  const response = await fetch("/api/resume/generate-pdf", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      title: resumeTitle,
                      personalInfo: formData.personalInfo,
                      education: formData.education,
                      experiences: formData.experiences,
                      projects: formData.projects,
                      skills: skillsObject, // Send as object format
                      certifications: formData.certifications || [],
                      extracurriculars: formData.extracurriculars || [],
                    }),
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to generate PDF");
                  }

                  // Get PDF blob
                  const blob = await response.blob();
                  console.log("✅ [STEP 2] PDF blob received, size:", blob.size, "bytes");
                  
                  // Convert blob to base64 for sessionStorage
                  const reader = new FileReader();
                  
                  reader.onloadend = () => {
                    // Guard against unmounted component
                    if (!isMountedRef.current) {
                      console.log("⚠️ Component unmounted, skipping navigation");
                      return;
                    }
                    
                    try {
                      const base64String = reader.result as string;
                      if (!base64String) {
                        throw new Error("FileReader returned empty result");
                      }
                      const base64Data = base64String.split(",")[1]; // Remove data:application/pdf;base64, prefix
                      
                      // Store preview data in sessionStorage
                      const previewData = {
                        pdfBlob: base64Data,
                        resumeData: {
                          title: resumeTitle,
                          personalInfo: formData.personalInfo,
                          education: formData.education,
                          experiences: formData.experiences,
                          projects: formData.projects,
                          skills: skillsObject, // Use skillsObject (Record<string, string>) not formData.skills
                          certifications: formData.certifications || [],
                          extracurriculars: formData.extracurriculars || [],
                        },
                        analysisId: analysisId,
                      };
                      
                      sessionStorage.setItem("resumePreviewData", JSON.stringify(previewData));
                      console.log("✅ Preview data saved to sessionStorage");
                      
                      // Check again before navigation
                      if (isMountedRef.current) {
                        // Navigate to preview page
                        router.push("/dashboard/resumebuilder/preview");
                      }
                    } catch (err) {
                      console.error("❌ Error in FileReader onloadend:", err);
                      if (isMountedRef.current) {
                        alert("Failed to process PDF. Please try again.");
                        setIsLoading(false);
                      }
                    }
                  };
                  
                  reader.onerror = () => {
                    console.error("❌ FileReader error");
                    if (isMountedRef.current) {
                      alert("Failed to process PDF. Please try again.");
                      setIsLoading(false);
                    }
                  };
                  
                  reader.readAsDataURL(blob);
                  console.log("✅ [STEP 3] FileReader started, will navigate to preview when complete...");
                } catch (error) {
                  console.error("❌ Error generating PDF:", error);
                  alert("Failed to generate PDF. Please try again.");
                  setIsLoading(false);
                }
              }}
              className="bg-violet-500 text-white hover:bg-violet-600"
              disabled={!resumeTitle || !formData.personalInfo.firstName || isLoading}
            >
              {isLoading ? "Generating PDF..." : "Generate PDF Resume"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
