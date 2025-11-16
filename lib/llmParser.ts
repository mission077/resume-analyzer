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
 * Creates an improved prompt for Gemini to ensure JSON output
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

  return `You are an expert resume and job-fit analyst. Analyze the resume and provide comprehensive feedback.

${jobContext}Resume Text:
${resumeText}

IMPORTANT: You must respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. Return ONLY the JSON object.

Required JSON format (return exactly this structure):
{
  "overallScore": <number between 0-100>,
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "gaps": ["specific gap 1", "specific gap 2", "specific gap 3"],
  "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"],
  "atsScore": <number between 0-100>
}

Return ONLY the JSON object, nothing else.`
}

