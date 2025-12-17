import { GoogleGenerativeAI } from "@google/generative-ai"
import { extractJsonFromText, createLiveFeedbackPrompt } from '@/lib/llmParser'

export interface LiveFeedback {
  status: 'alert' | 'warning' | 'safe' | 'incomplete'
  feedback: string
  hints: string[]
  suggestions: string[]
}

export interface LiveFeedbackResult {
  success: boolean
  feedback?: LiveFeedback
  error?: string
}

/**
 * Generates live feedback for a specific resume section
 * Handles two scenarios:
 * 1. From scratch: Only uses what user typed
 * 2. From analysis: Uses resume context + job description
 */
export async function generateLiveFeedback(
  sectionName: string,
  sectionContent: string,
  fullResumeContext?: string,
  jobContext?: {
    companyName?: string
    jobTitle?: string
    jobDescription?: string
  }
): Promise<LiveFeedbackResult> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY')
    }

    // Skip if content is too short (less than 3 characters) to avoid unnecessary API calls
    const trimmedContent = sectionContent?.trim() || ''
    if (trimmedContent.length < 3 && !fullResumeContext) {
      return {
        success: true,
        feedback: {
          status: 'incomplete',
          feedback: 'Keep typing to get AI feedback on this section.',
          hints: [],
          suggestions: []
        }
      }
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

    const prompt = createLiveFeedbackPrompt(
      sectionName,
      sectionContent,
      fullResumeContext,
      jobContext
    )

    const result = await model.generateContent(prompt)
    const response = await result.response
    const feedbackText = response.text() || 'No feedback generated'

    console.log('📋 Raw live feedback response:', feedbackText.substring(0, 200))

    // Extract JSON from response
    const feedbackData = extractJsonFromText(feedbackText)

    if (feedbackData && typeof feedbackData === 'object') {
      // Validate and normalize feedback structure
      const normalizedFeedback: LiveFeedback = {
        status: ['alert', 'warning', 'safe', 'incomplete'].includes(feedbackData.status)
          ? feedbackData.status
          : 'safe',
        feedback: typeof feedbackData.feedback === 'string' ? feedbackData.feedback : 'No feedback available',
        hints: Array.isArray(feedbackData.hints)
          ? feedbackData.hints.filter((h: any) => typeof h === 'string')
          : [],
        suggestions: Array.isArray(feedbackData.suggestions)
          ? feedbackData.suggestions.filter((s: any) => typeof s === 'string')
          : []
      }

      console.log('✅ Live feedback generated successfully')
      return {
        success: true,
        feedback: normalizedFeedback
      }
    } else {
      console.warn('⚠️ Failed to parse feedback JSON, using fallback')
      return {
        success: true,
        feedback: {
          status: 'safe',
          feedback: 'Section looks good. Keep adding details to get more specific feedback.',
          hints: [],
          suggestions: []
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Live feedback generation failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate feedback'
    }
  }
}
