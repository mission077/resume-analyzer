import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractJsonFromText } from "@/lib/llmParser";
import { ResumeData, PersonalInfo, Experience, Education, Skill, Project, Certification, SkillsObject } from "@/lib/resume/types";

export interface ParseResult {
  success: boolean;
  data?: ResumeData;
  error?: string;
}

/**
 * Parses unstructured resume text into structured ResumeData format
 * Uses Gemini AI to extract information - ONLY extracts what exists in text
 * NO hallucination - returns empty strings/null for missing information
 */
export async function parseResumeText(resumeText: string): Promise<ParseResult> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = createParsePrompt(resumeText);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parseText = response.text() || "No parsing generated";

    console.log("📋 Raw LLM parse response:", parseText.substring(0, 500));

    // Extract JSON from response
    const parsedData = extractJsonFromText(parseText);

    if (parsedData && typeof parsedData === "object") {
      // Validate and normalize the parsed data
      const normalizedData = normalizeParsedData(parsedData);

      console.log("✅ Successfully parsed resume data");
      return { success: true, data: normalizedData };
    } else {
      console.warn("⚠️ Failed to parse JSON, using fallback");
      const fallbackData = createEmptyResumeData();
      return {
        success: true,
        data: fallbackData,
      };
    }
  } catch (error: any) {
    console.error("❌ Resume parsing failed:", error);
    return {
      success: false,
      error: error.message || "Parsing failed",
    };
  }
}

/**
 * Creates prompt for Gemini to parse resume text
 * CRITICAL: Emphasizes NO hallucination - only extract what exists
 */
function createParsePrompt(resumeText: string): string {
  return `You are a resume parser. Extract ONLY information that explicitly exists in the resume text below.

CRITICAL RULES - READ CAREFULLY:
1. Extract ONLY what you see in the text - do NOT invent, guess, or infer missing information
2. If information is missing, return empty string "" or empty array [] or null
3. Do NOT add placeholder data, fake emails, or made-up information
4. Do NOT infer dates, locations, or details that aren't explicitly stated
5. If you're not certain something exists in the text, leave it empty
6. For skills: Extract only technologies/tools explicitly mentioned
7. For dates: Use exact format found in text (e.g., "May 2025", "Jan 2023 - Dec 2024")
8. For descriptions: Extract exact bullet points/text, preserve **bold** markdown if present

Resume Text:
${resumeText}

IMPORTANT: You must respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. Return ONLY the JSON object.

Required JSON format (return exactly this structure):
{
  "personalInfo": {
    "firstName": "string or empty",
    "lastName": "string or empty",
    "email": "string or empty",
    "phone": "string or empty",
    "linkedin": "string or empty (optional)",
    "github": "string or empty (optional)",
    "website": "string or empty (optional)"
  },
  "education": [
    {
      "school": "string",
      "degree": "string",
      "field": "string",
      "location": "string",
      "graduationDate": "string (format: Month Year)",
      "gpa": "string or empty (optional)",
      "academicAchievements": ["string"] or []
    }
  ],
  "experiences": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string (format: Month Year)",
      "endDate": "string or null (format: Month Year, null if current)",
      "isCurrent": boolean,
      "location": "string",
      "description": ["string"] (array of bullet points, preserve **bold** if present)
    }
  ],
  "projects": [
    {
      "name": "string",
      "techStack": ["string"],
      "description": ["string"] (array of bullet points, preserve **bold** if present)
    }
  ],
  "skills": {
    "Languages": "string (comma-separated)",
    "Frameworks and Libraries": "string (comma-separated)",
    "Development Tools": "string (comma-separated)",
    ... (other categories as found in text)
  },
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string (format: Month Year)",
      "expiryDate": "string or empty (optional)",
      "credentialId": "string or empty (optional)",
      "url": "string or empty (optional)"
    }
  ]
}

Return ONLY the JSON object, nothing else.`;
}

/**
 * Normalizes parsed data to match ResumeData interface
 * Ensures all required fields exist and are properly formatted
 */
function normalizeParsedData(parsed: any): ResumeData {
  return {
    personalInfo: {
      firstName: parsed.personalInfo?.firstName || "",
      lastName: parsed.personalInfo?.lastName || "",
      email: parsed.personalInfo?.email || "",
      phone: parsed.personalInfo?.phone || "",
      linkedin: parsed.personalInfo?.linkedin || "",
      github: parsed.personalInfo?.github || "",
      website: parsed.personalInfo?.website || "",
    },
    // summary field removed - not in our schema
    education: Array.isArray(parsed.education)
      ? parsed.education.map((edu: any) => ({
          id: Date.now().toString() + Math.random(), // Generate ID
          school: edu.school || "",
          degree: edu.degree || "",
          field: edu.field || "",
          location: edu.location || "",
          graduationDate: edu.graduationDate || "",
          gpa: edu.gpa || "",
          academicAchievements: Array.isArray(edu.academicAchievements)
            ? edu.academicAchievements
            : [],
          // startDate, endDate, isCurrent not in database schema for education
        }))
      : [],
    experiences: Array.isArray(parsed.experiences)
      ? parsed.experiences.map((exp: any) => ({
          id: Date.now().toString() + Math.random(), // Generate ID
          company: exp.company || "",
          position: exp.role || exp.position || "",
          startDate: exp.startDate || "",
          endDate: exp.endDate || null,
          isCurrent: exp.isCurrent || false,
          location: exp.location || "",
          description: Array.isArray(exp.description)
            ? exp.description
            : exp.description
            ? [exp.description]
            : [],
          bullets: Array.isArray(exp.description)
            ? exp.description
            : exp.description
            ? [exp.description]
            : [], // Alias for compatibility
          type: "job" as const, // Default to 'job', can be updated by user
        }))
      : [],
    projects: Array.isArray(parsed.projects)
      ? parsed.projects.map((proj: any) => ({
          id: Date.now().toString() + Math.random(), // Generate ID
          name: proj.name || "",
          description: Array.isArray(proj.description)
            ? proj.description.join(" ")
            : proj.description || "",
          technologies: Array.isArray(proj.techStack)
            ? proj.techStack
            : proj.techStack
            ? [proj.techStack]
            : [],
        }))
      : [],
    skills: parsed.skills && typeof parsed.skills === "object"
      ? Object.entries(parsed.skills)
          .filter(([_, value]) => value && typeof value === "string")
          .flatMap(([category, value]) => {
            const skillNames = (value as string)
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            return skillNames.map((name) => ({
              id: Date.now().toString() + Math.random(),
              name,
              category: mapCategoryToSkillType(category),
            }));
          })
      : [],
    certifications: Array.isArray(parsed.certifications)
      ? parsed.certifications.map((cert: any) => ({
          id: Date.now().toString() + Math.random(), // Generate ID
          name: cert.name || "",
          issuer: cert.issuer || "",
          date: cert.date || "",
          expiryDate: cert.expiryDate || "",
          credentialId: cert.credentialId || "",
          url: cert.url || "",
        }))
      : [],
    extracurriculars: [], // Not parsed from text, user can add manually
  };
}

/**
 * Maps skill category names to Skill type categories
 */
function mapCategoryToSkillType(category: string): Skill["category"] {
  const lower = category.toLowerCase();
  if (lower.includes("language")) return "language";
  if (lower.includes("framework") || lower.includes("library")) return "framework";
  if (lower.includes("tool") || lower.includes("development")) return "tool";
  return "other";
}

/**
 * Creates empty ResumeData structure as fallback
 */
function createEmptyResumeData(): ResumeData {
  return {
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
  };
}

