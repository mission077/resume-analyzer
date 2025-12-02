import { GoogleGenerativeAI } from "@google/generative-ai"
import { extractJsonFromText, createAnalysisPrompt } from '@/lib/llmParser'

export interface DetailedAnalysis {
  content_quality: { score: number; feedback: string }
  skills_match: { score: number; feedback: string }
  structure_format: { score: number; feedback: string }
  tone_style: { score: number; feedback: string }
  experience_relevance: { score: number; feedback: string }
}

export interface SectionFeedback {
  section: 'education' | 'experiences' | 'projects' | 'skills' | 'certifications' | 'extracurriculars' | 'personalInfo'
  status: 'alert' | 'warning' | 'safe'
  feedback: string
  hints: string[]
}

export interface MissingKeywords {
  critical: string[]
  important: string[]
  nice_to_have: string[]
}

export interface ComprehensiveAnalysis {
  ats_score: number
  status: 'Excellent Match' | 'Good Fit' | 'Needs Work' | 'Major Gaps'
  detailed_analysis: DetailedAnalysis
  pros: string[]
  cons: string[]
  missing_keywords: MissingKeywords
  matched_keywords: string[]
  key_insights: string
  section_feedback: SectionFeedback[]
}

export interface AnalysisResult {
  success: boolean
  analysis?: ComprehensiveAnalysis
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
      // Determine status based on ATS score
      const atsScore = typeof analysis.ats_score === 'number' 
        ? Math.max(0, Math.min(100, analysis.ats_score)) 
        : typeof analysis.atsScore === 'number' 
          ? Math.max(0, Math.min(100, analysis.atsScore))
          : 70
      
      let status: 'Excellent Match' | 'Good Fit' | 'Needs Work' | 'Major Gaps'
      if (atsScore >= 80) status = 'Excellent Match'
      else if (atsScore >= 60) status = 'Good Fit'
      else if (atsScore >= 40) status = 'Needs Work'
      else status = 'Major Gaps'
      
      // Normalize detailed_analysis
      const detailedAnalysis = analysis.detailed_analysis || {}
      const normalizedDetailedAnalysis: DetailedAnalysis = {
        content_quality: {
          score: typeof detailedAnalysis.content_quality?.score === 'number' 
            ? Math.max(0, Math.min(100, detailedAnalysis.content_quality.score)) 
            : 75,
          feedback: typeof detailedAnalysis.content_quality?.feedback === 'string' 
            ? detailedAnalysis.content_quality.feedback 
            : 'Content quality analysis'
        },
        skills_match: {
          score: typeof detailedAnalysis.skills_match?.score === 'number' 
            ? Math.max(0, Math.min(100, detailedAnalysis.skills_match.score)) 
            : 70,
          feedback: typeof detailedAnalysis.skills_match?.feedback === 'string' 
            ? detailedAnalysis.skills_match.feedback 
            : 'Skills match analysis'
        },
        structure_format: {
          score: typeof detailedAnalysis.structure_format?.score === 'number' 
            ? Math.max(0, Math.min(100, detailedAnalysis.structure_format.score)) 
            : 80,
          feedback: typeof detailedAnalysis.structure_format?.feedback === 'string' 
            ? detailedAnalysis.structure_format.feedback 
            : 'Structure and format analysis'
        },
        tone_style: {
          score: typeof detailedAnalysis.tone_style?.score === 'number' 
            ? Math.max(0, Math.min(100, detailedAnalysis.tone_style.score)) 
            : 75,
          feedback: typeof detailedAnalysis.tone_style?.feedback === 'string' 
            ? detailedAnalysis.tone_style.feedback 
            : 'Tone and style analysis'
        },
        experience_relevance: {
          score: typeof detailedAnalysis.experience_relevance?.score === 'number' 
            ? Math.max(0, Math.min(100, detailedAnalysis.experience_relevance.score)) 
            : 70,
          feedback: typeof detailedAnalysis.experience_relevance?.feedback === 'string' 
            ? detailedAnalysis.experience_relevance.feedback 
            : 'Experience relevance analysis'
        }
      }
      
      // Normalize pros and cons
      const pros = Array.isArray(analysis.pros) 
        ? analysis.pros.filter((p: any) => typeof p === 'string')
        : Array.isArray(analysis.strengths)
          ? analysis.strengths.filter((s: any) => typeof s === 'string')
          : []
      
      const cons = Array.isArray(analysis.cons) 
        ? analysis.cons.filter((c: any) => typeof c === 'string')
        : Array.isArray(analysis.gaps)
          ? analysis.gaps.filter((g: any) => typeof g === 'string')
          : []
      
      // Ensure at least some pros/cons
      if (pros.length === 0) {
        pros.push('Resume analysis completed successfully')
      }
      if (cons.length === 0) {
        cons.push('Continue building relevant experience')
      }
      
      // Normalize missing keywords
      const missingKeywords: MissingKeywords = {
        critical: Array.isArray(analysis.missing_keywords?.critical) 
          ? analysis.missing_keywords.critical.filter((k: any) => typeof k === 'string')
          : [],
        important: Array.isArray(analysis.missing_keywords?.important) 
          ? analysis.missing_keywords.important.filter((k: any) => typeof k === 'string')
          : [],
        nice_to_have: Array.isArray(analysis.missing_keywords?.nice_to_have) 
          ? analysis.missing_keywords.nice_to_have.filter((k: any) => typeof k === 'string')
          : []
      }
      
      // Normalize matched keywords
      const matchedKeywords = Array.isArray(analysis.matched_keywords) 
        ? analysis.matched_keywords.filter((k: any) => typeof k === 'string')
        : []
      
      // Normalize key insights
      const keyInsights = typeof analysis.key_insights === 'string' 
        ? analysis.key_insights
        : `Your resume shows ${status === 'Excellent Match' ? 'strong' : status === 'Good Fit' ? 'good' : 'potential'} alignment with this role.`
      
      // Normalize section feedback
      const sectionFeedback: SectionFeedback[] = Array.isArray(analysis.section_feedback)
        ? analysis.section_feedback
          .filter((sf: any) => 
            sf && 
            typeof sf.section === 'string' && 
            ['education', 'experiences', 'projects', 'skills', 'certifications', 'extracurriculars', 'personalInfo'].includes(sf.section) &&
            typeof sf.status === 'string' && 
            ['alert', 'warning', 'safe'].includes(sf.status)
          )
          .map((sf: any) => ({
            section: sf.section as SectionFeedback['section'],
            status: sf.status as SectionFeedback['status'],
            feedback: typeof sf.feedback === 'string' ? sf.feedback : '',
            hints: Array.isArray(sf.hints) ? sf.hints.filter((h: any) => typeof h === 'string') : []
          }))
        : []
      
      // Ensure all required sections are present
      const requiredSections = ['education', 'experiences', 'projects', 'skills', 'certifications', 'extracurriculars', 'personalInfo'] as const
      const existingSections = new Set(sectionFeedback.map(sf => sf.section))
      requiredSections.forEach(section => {
        if (!existingSections.has(section)) {
          sectionFeedback.push({
            section,
            status: 'safe',
            feedback: `${section} section looks good`,
            hints: []
          })
        }
      })
      
      const normalizedAnalysis: ComprehensiveAnalysis = {
        ats_score: atsScore,
        status,
        detailed_analysis: normalizedDetailedAnalysis,
        pros,
        cons,
        missing_keywords: missingKeywords,
        matched_keywords: matchedKeywords,
        key_insights: keyInsights,
        section_feedback: sectionFeedback
      }
      
      console.log('✅ Successfully parsed comprehensive analysis')
      return { success: true, analysis: normalizedAnalysis }
    } else {
      console.warn('⚠️ Failed to parse JSON, using fallback. Raw response:', analysisText.substring(0, 200))
      const fallbackAnalysis: ComprehensiveAnalysis = {
        ats_score: 70,
        status: 'Good Fit',
        detailed_analysis: {
          content_quality: { score: 75, feedback: 'Content quality analysis' },
          skills_match: { score: 70, feedback: 'Skills match analysis' },
          structure_format: { score: 80, feedback: 'Structure and format analysis' },
          tone_style: { score: 75, feedback: 'Tone and style analysis' },
          experience_relevance: { score: 70, feedback: 'Experience relevance analysis' }
        },
        pros: ['Resume processed successfully'],
        cons: ['Analysis format parsing failed - please try again'],
        missing_keywords: { critical: [], important: [], nice_to_have: [] },
        matched_keywords: [],
        key_insights: 'Please review the analysis manually',
        section_feedback: [
          { section: 'education', status: 'safe', feedback: 'Education section', hints: [] },
          { section: 'experiences', status: 'safe', feedback: 'Experiences section', hints: [] },
          { section: 'projects', status: 'safe', feedback: 'Projects section', hints: [] },
          { section: 'skills', status: 'safe', feedback: 'Skills section', hints: [] },
          { section: 'certifications', status: 'safe', feedback: 'Certifications section', hints: [] },
          { section: 'extracurriculars', status: 'safe', feedback: 'Extracurriculars section', hints: [] },
          { section: 'personalInfo', status: 'safe', feedback: 'Personal info section', hints: [] }
        ]
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

