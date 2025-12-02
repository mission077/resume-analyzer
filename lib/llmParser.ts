/**
 * Extracts and parses JSON from LLM response text
 * Handles cases where JSON is wrapped in markdown code blocks or has extra text
 */
export function extractJsonFromText(text: string): any | null {
  if (!text) return null

  // Try to parse directly first
  try {
    return JSON.parse(text.trim())
  } catch {
    // Continue to extraction methods
  }

  // Try to extract JSON from markdown code blocks
  const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*\})\s*```/
  const jsonMatch = text.match(jsonBlockRegex)
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1].trim())
    } catch {
      // Continue to next method
    }
  }

  // Try to find JSON object in the text (look for first { and last })
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonCandidate = text.substring(firstBrace, lastBrace + 1)
      return JSON.parse(jsonCandidate.trim())
    } catch {
      // Continue to next method
    }
  }

  // Try to extract JSON array if object parsing failed
  const arrayRegex = /\[[\s\S]*\]/
  const arrayMatch = text.match(arrayRegex)
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0].trim())
    } catch {
      // Continue
    }
  }

  return null
}

/**
 * Creates a comprehensive prompt for Gemini to analyze resume with job context
 * Returns detailed ATS score, section-level feedback, and actionable insights
 */
export function createAnalysisPrompt(
  resumeText: string,
  companyName?: string,
  jobTitle?: string,
  jobDescription?: string
): string {
  const jobContext = companyName && jobTitle && jobDescription
    ? `Company: ${companyName}
Job Title: ${jobTitle}
Job Description: ${jobDescription}

`
    : ''

  return `You are an expert ATS (Applicant Tracking System) resume analyst and career advisor. Analyze the resume against the job description and provide comprehensive, actionable feedback.

${jobContext}Resume Text:
${resumeText}

IMPORTANT: You must respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. Return ONLY the JSON object.

Analyze the resume focusing on:
1. ATS compatibility (keyword matching, format, structure)
2. Content quality (action verbs, quantifiable metrics, clarity)
3. Skills alignment with job requirements
4. Experience relevance to the role
5. Section-specific improvements needed

Required JSON format (return exactly this structure):
{
  "ats_score": <number 0-100>,
  "status": <"Excellent Match" | "Good Fit" | "Needs Work" | "Major Gaps">,
  "detailed_analysis": {
    "content_quality": {
      "score": <number 0-100>,
      "feedback": "<brief feedback about content quality>"
    },
    "skills_match": {
      "score": <number 0-100>,
      "feedback": "<brief feedback about skills alignment>"
    },
    "structure_format": {
      "score": <number 0-100>,
      "feedback": "<brief feedback about ATS-friendly format>"
    },
    "tone_style": {
      "score": <number 0-100>,
      "feedback": "<brief feedback about professional tone>"
    },
    "experience_relevance": {
      "score": <number 0-100>,
      "feedback": "<brief feedback about experience relevance>"
    }
  },
  "pros": [
    "<specific positive aspect 1>",
    "<specific positive aspect 2>",
    "<specific positive aspect 3>",
    "<specific positive aspect 4>"
  ],
  "cons": [
    "<specific area for improvement 1>",
    "<specific area for improvement 2>",
    "<specific area for improvement 3>",
    "<specific area for improvement 4>"
  ],
  "missing_keywords": {
    "critical": ["<keyword 1>", "<keyword 2>", "<keyword 3>"],
    "important": ["<keyword 1>", "<keyword 2>"],
    "nice_to_have": ["<keyword 1>", "<keyword 2>"]
  },
  "matched_keywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>"],
  "key_insights": "<2-3 sentence narrative summary tying everything together, personalized based on ats_score range>",
  "section_feedback": [
    {
      "section": "education",
      "status": <"alert" | "warning" | "safe">,
      "feedback": "<brief feedback about education section>",
      "hints": [
        "<actionable hint 1>",
        "<actionable hint 2>",
        "<actionable hint 3>"
      ]
    },
    {
      "section": "experiences",
      "status": <"alert" | "warning" | "safe">,
      "feedback": "<brief feedback about experiences section>",
      "hints": [
        "<actionable hint 1>",
        "<actionable hint 2>"
      ]
    },
    {
      "section": "projects",
      "status": <"alert" | "warning" | "safe">,
      "feedback": "<brief feedback about projects section>",
      "hints": [
        "<actionable hint 1>",
        "<actionable hint 2>"
      ]
    },
    {
      "section": "skills",
      "status": <"alert" | "warning" | "safe">,
      "feedback": "<brief feedback about skills section>",
      "hints": [
        "<actionable hint 1>"
      ]
    },
    {
      "section": "certifications",
      "status": <"alert" | "warning" | "safe">,
      "feedback": "<brief feedback about certifications section>",
      "hints": [
        "<actionable hint 1>"
      ]
    },
    {
      "section": "extracurriculars",
      "status": <"alert" | "warning" | "safe">,
      "feedback": "<brief feedback about extracurriculars section>",
      "hints": []
    },
    {
      "section": "personalInfo",
      "status": <"alert" | "warning" | "safe">,
      "feedback": "<brief feedback about personal info section>",
      "hints": []
    }
  ]
}

Status determination:
- "Excellent Match": ats_score 80-100
- "Good Fit": ats_score 60-79
- "Needs Work": ats_score 40-59
- "Major Gaps": ats_score 0-39

Key Insights should be dynamic based on ats_score:
- 80-100: Focus on few missing keywords, add metrics
- 60-79: Highlight missing experience/keywords, add metrics
- 40-59: Prioritize keywords, quantify achievements, emphasize relevant experience
- 0-39: Consider transferable skills or similar roles

For section_feedback:
- "alert": Section has significant issues that need immediate attention
- "warning": Section could be improved but is acceptable
- "safe": Section is well-done and aligns with job requirements

Hints should be actionable and specific, not generic. Include missing keywords from missing_keywords when relevant to that section.

Return ONLY the JSON object, nothing else.`
}

