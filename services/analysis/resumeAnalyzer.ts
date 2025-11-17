import { GoogleGenerativeAI } from "@google/generative-ai"
import { extractJsonFromText, createAnalysisPrompt } from '@/lib/llmParser'

export interface AnalysisResult {
  success: boolean
  analysis?: {
    overallScore: number
    strengths: string[]
    gaps: string[]
    recommendations: string[]
    atsScore: number
  }
  error?: string
}

export async function analyzeResume(
  resumeText: string,
  companyName?: string,
  jobTitle?: string,
  jobDescription?: string
): Promise<AnalysisResult> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY')
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
    
    const prompt = createAnalysisPrompt(resumeText, companyName, jobTitle, jobDescription)

    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysisText = response.text() || 'No analysis generated'
    
    console.log('📋 Raw LLM response:', analysisText.substring(0, 500))
    
    // Try to extract JSON from the response
    const analysis = extractJsonFromText(analysisText)
    
    if (analysis && typeof analysis === 'object') {
      // Validate and normalize the analysis object
      const normalizedAnalysis = {
        overallScore: typeof analysis.overallScore === 'number' ? Math.max(0, Math.min(100, analysis.overallScore)) : 75,
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths.filter(s => typeof s === 'string') : [],
        gaps: Array.isArray(analysis.gaps) ? analysis.gaps.filter(g => typeof g === 'string') : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.filter(r => typeof r === 'string') : [],
        atsScore: typeof analysis.atsScore === 'number' ? Math.max(0, Math.min(100, analysis.atsScore)) : 70
      }
      
      // Ensure we have at least some data
      if (normalizedAnalysis.strengths.length === 0) {
        normalizedAnalysis.strengths = ["Resume analysis completed"]
      }
      if (normalizedAnalysis.gaps.length === 0) {
        normalizedAnalysis.gaps = ["No significant gaps identified"]
      }
      if (normalizedAnalysis.recommendations.length === 0) {
        normalizedAnalysis.recommendations = ["Continue building relevant experience"]
      }
      
      console.log('✅ Successfully parsed analysis:', normalizedAnalysis)
      return { success: true, analysis: normalizedAnalysis }
    } else {
      console.warn('⚠️ Failed to parse JSON, using fallback. Raw response:', analysisText.substring(0, 200))
      const fallbackAnalysis = {
        overallScore: 75,
        strengths: ["Resume processed successfully"],
        gaps: ["Analysis format parsing failed - please try again"],
        recommendations: ["Please review the analysis manually"],
        atsScore: 70
      }
      return { 
        success: true, 
        analysis: fallbackAnalysis
      }
    }
  } catch (error: any) {
    console.error('❌ Resume analysis failed:', error)
    return { 
      success: false, 
      error: error.message || 'Analysis failed' 
    }
  }
}

