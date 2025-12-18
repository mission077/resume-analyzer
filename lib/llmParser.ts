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

  return `You are an expert ATS (Applicant Tracking System) resume analyst and career advisor. Analyze the resume against the job description and provide comprehensive, actionable feedback that helps users directly edit their original resume.

CRITICAL ANTI-HALLUCINATION RULES - YOU MUST FOLLOW THESE STRICTLY (NO EXCEPTIONS):
1. NEVER suggest adding information that isn't already implied or present in the resume text provided above
2. NEVER invent, create, or fabricate any information not explicitly stated in the resume
3. ONLY reframe, reorganize, or ask questions to help users recall existing experience - NEVER suggest new content
4. If a skill/technology isn't mentioned anywhere in the resume, ask a question rather than suggesting to add it (e.g., "Did you use [technology] in [project]? If so, mention it explicitly")
5. For unclear sentences, suggest format improvements (Role + Metrics + Consequences) but use ONLY information from the resume text
6. Do NOT create or invent new information - only work with what's already there
7. When referencing experiences, projects, or skills, ONLY reference what is actually written in the resume text above
8. If you cannot find evidence in the resume text, ask a question instead of making assumptions

${jobContext}Resume Text:
${resumeText}

IMPORTANT: You must respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. Return ONLY the JSON object.

Analyze the resume focusing on:
1. ATS compatibility (keyword matching, format, structure)
2. Content quality (action verbs, quantifiable metrics, clarity)
3. Skills alignment with job requirements
4. Experience relevance to the role
5. Section-specific improvements needed
6. Specific, actionable edits users can make to their original resume

Required JSON format (return exactly this structure):
{
  "ats_score": <number 0-100>,
  "status": <"Excellent Match" | "Good Fit" | "Needs Work" | "Major Gaps">,
  "key_insights": "<ONE sentence complimentary insight about their potential/strengths - focus on what field they're good at or their potential, keep it encouraging>",
  "action_plan": [
    {
      "priority": 1,
      "action": "<Question format: 'Did you use [technology] in [specific project/experience]? If so, mention it explicitly: [suggestion]' OR 'Your [experience] relates to [job requirement] - consider reframing: [suggestion]' OR 'I see your sentence about [topic] is unclear. I suggest following this format: Role + Metrics + Consequences. Example: [format example using their existing info]'>",
      "time_estimate": "<5 min | 10 min | 15 min>"
    },
    {
      "priority": 2,
      "action": "<Question format: 'Did you use [technology] in [specific project/experience]? If so, mention it explicitly: [suggestion]' OR 'Your [experience] relates to [job requirement] - consider reframing: [suggestion]' OR 'I see your sentence about [topic] is unclear. I suggest following this format: Role + Metrics + Consequences. Example: [format example using their existing info]'>",
      "time_estimate": "<5 min | 10 min | 15 min>"
    },
    {
      "priority": 3,
      "action": "<Question format: 'Did you use [technology] in [specific project/experience]? If so, mention it explicitly: [suggestion]' OR 'Your [experience] relates to [job requirement] - consider reframing: [suggestion]' OR 'I see your sentence about [topic] is unclear. I suggest following this format: Role + Metrics + Consequences. Example: [format example using their existing info]'>",
      "time_estimate": "<5 min | 10 min | 15 min>"
    }
  ],
  "skills_match_comparison": [
    {
      "skill": "<skill name from job description>",
      "status": <"strong" | "listed_but_not_demonstrated" | "missing">,
      "evidence": "<brief evidence from resume, e.g. '3 projects' or 'In skills but not in descriptions'>",
      "icon": <"✅" | "⚠️" | "❌">,
      "suggestion": "<Question format if status is not 'strong': 'Did you use [skill] in [location]? If so, mention it explicitly' OR 'Your [experience] relates to [skill] - consider emphasizing this connection'. Empty string if status is 'strong'>"
    }
  ],
  "quick_wins": [
    {
      "win": "<positive, constructive suggestion framed as a quick win>",
      "impact": "<brief explanation of why this helps>"
    },
    {
      "win": "<positive, constructive suggestion framed as a quick win>",
      "impact": "<brief explanation of why this helps>"
    },
    {
      "win": "<positive, constructive suggestion framed as a quick win>",
      "impact": "<brief explanation of why this helps>"
    }
  ],
  "missing_keywords": {
    "critical": [
      {
        "keyword": "<keyword name from job description>",
        "where_to_add": [
          {
            "section": "<experiences | projects | skills | certifications>",
            "location": "<specific location from resume, e.g. 'Fovea project' or 'Nucor Corporation experience'>",
            "suggestion": "<Question format: 'Did you use [keyword] in [location]? If so, mention it explicitly: [suggestion using their existing info]' OR 'Your [location] relates to [keyword] - consider reframing: [suggestion]'>"
          }
        ]
      }
    ],
    "important": [
      {
        "keyword": "<keyword name from job description>",
        "where_to_add": [
          {
            "section": "<experiences | projects | skills | certifications>",
            "location": "<specific location from resume>",
            "suggestion": "<Question format: 'Did you use [keyword] in [location]? If so, mention it explicitly: [suggestion]' OR 'Your [location] relates to [keyword] - consider reframing: [suggestion]'>"
          }
        ]
      }
    ],
    "nice_to_have": [
      {
        "keyword": "<keyword name from job description>",
        "where_to_add": [
          {
            "section": "<experiences | projects | skills | certifications>",
            "location": "<specific location from resume>",
            "suggestion": "<Question format: 'Did you use [keyword] in [location]? If so, mention it explicitly: [suggestion]' OR 'Your [location] relates to [keyword] - consider reframing: [suggestion]'>"
          }
        ]
      }
    ]
  },
  "example_edit": {
    "section": "<experiences | projects | skills>",
    "location": "<specific location from resume, e.g. 'Fovea project' or 'Nucor Corporation, bullet 1'>",
    "before": "<exact current text from resume - must be verbatim>",
    "after": "<improved version using ONLY information already in the resume, reframed with better format (Role + Metrics + Consequences) and explicit mentions of technologies already implied>",
    "improvements": [
      "<format improvement 1, e.g. 'Reframed to follow Role + Metrics + Consequences format'>",
      "<format improvement 2, e.g. 'Made technology explicit (was implied)'>",
      "<format improvement 3, e.g. 'Improved clarity and structure'>"
    ]
  },
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
  "matched_keywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>"],
  "section_feedback": [
    {
      "section": "education",
      "status": <"alert" | "warning" | "safe">,
      "feedback": "<brief feedback about education section>",
      "hints": [
        "<Question-based hint: 'Did you use [tech] in this section? If so, mention it explicitly' OR 'Review your [specific item] - does it follow Role + Metrics + Consequences format?' OR 'Your [item] relates to [job requirement] - consider emphasizing this connection'>",
        "<Question-based hint: 'Did you use [tech] in this section? If so, mention it explicitly' OR 'Review your [specific item] - does it follow Role + Metrics + Consequences format?' OR 'Your [item] relates to [job requirement] - consider emphasizing this connection'>",
        "<Question-based hint: 'Did you use [tech] in this section? If so, mention it explicitly' OR 'Review your [specific item] - does it follow Role + Metrics + Consequences format?' OR 'Your [item] relates to [job requirement] - consider emphasizing this connection'>"
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

Key Insights (ONE sentence only):
- Should be complimentary and insightful about their potential/strengths
- Focus on what field they're good at or their potential
- Keep it encouraging, not wordy
- Examples: "Your strong AI/ML project portfolio shows excellent potential in AI-native development" or "Your full-stack experience with React and Python positions you well for modern web development roles"

Action Plan (Top 3 only) - MUST BE QUESTION-BASED:
- Format: "Did you use [technology] in [specific project/experience]? If so, mention it explicitly: [suggestion]"
- OR: "Your [experience] relates to [job requirement] - consider reframing: [suggestion using their existing info]"
- OR: "I see your sentence about [topic] is unclear. I suggest following this format: Role + Metrics + Consequences. Example: [format example using ONLY their existing info]"
- NEVER suggest adding information that isn't already in the resume
- Examples: "Did you use Node.js in your Fovea project? If so, mention it explicitly: 'Built with Node.js backend'", "Your Nucor experience mentions monitoring - this relates to observability. Consider reframing: 'Implemented observability with logging and tracing'"

Skills Match Comparison:
- Extract ALL key skills mentioned in job description
- For each skill, determine: strong (clearly demonstrated), listed_but_not_demonstrated (mentioned but not shown), or missing
- Provide evidence from resume
- Include question-based suggestion only if status is not "strong": "Did you use [skill] in [location]? If so, mention it explicitly" OR "Your [experience] relates to [skill] - consider emphasizing this connection"

Quick Wins:
- Frame improvements positively as "quick wins"
- Focus on easy, high-impact changes
- Keep tone constructive and encouraging
- Examples: "Your PHP/C# internship is valuable but overshadowed - lead with Python/TS projects in your summary", "You have Node.js listed but buried - feature it prominently in 1-2 projects"

Missing Keywords (Keywords to Emphasize):
- For each keyword from job description, check if user has related experience in resume
- If related experience exists, ask question: "Did you use [keyword] in [location]? If so, mention it explicitly: [suggestion]"
- If no related experience, do NOT suggest adding it - skip this keyword
- Include section, location from resume, and question-based suggestion
- Critical keywords should have 1-2 placement suggestions (only if evidence exists)
- Important/nice_to_have can have 1 placement suggestion (only if evidence exists)

Example Edit:
- Choose the highest priority section/issue
- Show exact before text from resume (verbatim)
- After text must use ONLY information already in the resume
- If sentence is unclear, suggest format: Role + Metrics + Consequences
- Highlight 2-3 format/structure improvements (not content additions)
- Make it concrete and actionable - show how to reframe existing content

For section_feedback:
- "alert": Section has significant issues that need immediate attention
- "warning": Section could be improved but is acceptable
- "safe": Section is well-done and aligns with job requirements

Hints should be question-based and fact-based, not generic. Ask questions about existing content, suggest format improvements, or help reframe existing information. NEVER suggest adding new information. Include questions about keywords from missing_keywords when relevant to that section, but only if related experience exists in that section.

Return ONLY the JSON object, nothing else.
`
}

/**
 * Creates a prompt for live feedback on a specific section
 * Handles two scenarios:
 * 1. From scratch: Only uses what user typed, no job context
 * 2. From analysis: Uses resume context + job description
 */
export function createLiveFeedbackPrompt(
  sectionName: string,
  sectionContent: string,
  fullResumeContext?: string,
  jobContext?: {
    companyName?: string
    jobTitle?: string
    jobDescription?: string
  }
): string {
  const hasJobContext = jobContext?.companyName && jobContext?.jobTitle && jobContext?.jobDescription
  const hasResumeContext = !!fullResumeContext && fullResumeContext.trim().length > 0

  // Scenario 1: From scratch - only what user typed
  if (!hasJobContext && !hasResumeContext) {
    return `You are an expert resume advisor helping a user fill out their resume from scratch. Provide constructive, encouraging feedback on the ${sectionName} section they are currently filling out.

CRITICAL ANTI-HALLUCINATION RULES - YOU MUST FOLLOW THESE STRICTLY (NO EXCEPTIONS):
1. ONLY provide feedback on what the user has actually typed in the section content below - do NOT suggest adding information they haven't mentioned
2. NEVER invent, create, or fabricate any information not explicitly typed by the user
3. Guide them on format, structure, and best practices for this section (format guidance only)
4. Ask questions to help them think about what to include, but NEVER suggest specific content they should add
5. If content is too short or incomplete, suggest what types of information are typically included in this section (format guidance only, no specific examples)
6. Keep feedback encouraging and constructive
7. Do NOT hallucinate or invent information - only work with what the user has typed
8. When giving examples, use generic format examples, NOT specific content suggestions

${sectionName} Section Content:
${sectionContent || '(empty or very minimal content)'}

Provide feedback in this JSON format:
{
  "status": <"alert" | "warning" | "safe" | "incomplete">,
  "feedback": "<1-2 sentence summary of the section's current state>",
  "hints": [
    "<Format/structure guidance question or suggestion - e.g. 'Consider adding [type of info] to strengthen this section' or 'Your [field] looks good - have you considered including [format suggestion]?'>",
    "<Another helpful hint about format or structure>"
  ],
  "suggestions": [
    "<Question-based format suggestion - e.g. 'For [field], consider using this format: [example format]' or 'Have you thought about including [type of information]?'>"
  ]
}

Status meanings:
- "incomplete": Section is empty or has minimal content (guide on what to include)
- "alert": Section has issues that need attention (format, missing required fields)
- "warning": Section could be improved but is acceptable
- "safe": Section looks good

Return ONLY the JSON object, nothing else.`
  }

  // Scenario 2: From analysis - has job context and/or resume context
  const jobContextText = hasJobContext
    ? `Job Context:
Company: ${jobContext.companyName}
Job Title: ${jobContext.jobTitle}
Job Description: ${jobContext.jobDescription}

`
    : ''

  const resumeContextText = hasResumeContext
    ? `Full Resume Context (for reference - user is editing the ${sectionName} section):
${fullResumeContext}

`
    : ''

  return `You are an expert ATS resume analyst providing live feedback as a user edits their resume. The user is currently working on the ${sectionName} section. Provide specific, actionable feedback that helps them improve this section.

CRITICAL ANTI-HALLUCINATION RULES - YOU MUST FOLLOW THESE STRICTLY (NO EXCEPTIONS):
1. ONLY provide feedback on what the user has actually typed in the current ${sectionName} section content below
2. NEVER suggest adding information that isn't already present in the section content OR in the resume context provided above
3. NEVER invent, create, or fabricate any information not explicitly stated in the section content or resume context
4. If suggesting improvements, ONLY reframe or reorganize existing content - do NOT add new information
5. Ask questions about existing content rather than suggesting new content (e.g., "Did you use [tech] in [experience]? If so, mention it explicitly")
6. For format improvements, use ONLY information from the resume context or current section content
7. Do NOT hallucinate or invent information - only work with what's provided
8. When referencing other sections, ONLY reference what is actually written in the resume context above
9. If you cannot find evidence in the provided content, ask a question instead of making assumptions

${jobContextText}${resumeContextText}Current ${sectionName} Section Content:
${sectionContent || '(empty or very minimal content)'}

Provide feedback in this JSON format:
{
  "status": <"alert" | "warning" | "safe" | "incomplete">,
  "feedback": "<1-2 sentence summary focusing on alignment with job requirements and ATS optimization>",
  "hints": [
    "<Question-based hint referencing existing content - e.g. 'Did you use [technology] in [experience]? If so, mention it explicitly here' OR 'Your [existing content] relates to [job requirement] - consider emphasizing this connection'>",
    "<Another actionable hint based on job context and existing content>"
  ],
  "suggestions": [
    "<Format or reframing suggestion using existing content - e.g. 'Consider reframing your [existing point] to highlight [job-relevant aspect]' OR 'Your [existing content] could be strengthened by following Role + Metrics + Consequences format'>"
  ]
}

Status meanings:
- "incomplete": Section is empty or has minimal content
- "alert": Section has significant issues or missing critical job-relevant information
- "warning": Section could be improved to better align with job requirements
- "safe": Section looks good and aligns well with job requirements

Focus on:
- ATS keyword optimization (if job context provided)
- Format and structure improvements
- Alignment with job requirements (if job context provided)
- Using existing content more effectively

Return ONLY the JSON object, nothing else.`
}
