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

export interface KeywordPlacement {
  section: 'experiences' | 'projects' | 'skills' | 'certifications'
  location: string
  suggestion: string
}

export interface KeywordWithPlacement {
  keyword: string
  where_to_add: KeywordPlacement[]
}

export interface MissingKeywords {
  critical: KeywordWithPlacement[]
  important: KeywordWithPlacement[]
  nice_to_have: KeywordWithPlacement[]
}

export interface ActionPlanItem {
  priority: number
  action: string
  time_estimate: string
}

export interface SkillsMatchComparisonItem {
  skill: string
  status: 'strong' | 'listed_but_not_demonstrated' | 'missing'
  evidence: string
  icon: '✅' | '⚠️' | '❌'
  suggestion: string
}

export interface QuickWin {
  win: string
  impact: string
}

export interface ExampleEdit {
  section: 'experiences' | 'projects' | 'skills'
  location: string
  before: string
  after: string
  improvements: string[]
}

export interface ComprehensiveAnalysis {
  ats_score: number
  status: 'Excellent Match' | 'Good Fit' | 'Needs Work' | 'Major Gaps'
  key_insights: string
  action_plan: ActionPlanItem[]
  skills_match_comparison: SkillsMatchComparisonItem[]
  quick_wins: QuickWin[]
  missing_keywords: MissingKeywords
  example_edit: ExampleEdit
  detailed_analysis: DetailedAnalysis
  pros: string[]
  cons: string[]
  matched_keywords: string[]
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
      
      // Normalize key insights (keep it to 1 line)
      const keyInsights = typeof analysis.key_insights === 'string' 
        ? analysis.key_insights.trim()
        : `Your resume shows ${status === 'Excellent Match' ? 'strong' : status === 'Good Fit' ? 'good' : 'potential'} alignment with this role.`
      
      // Normalize action plan (top 3)
      const actionPlan: ActionPlanItem[] = Array.isArray(analysis.action_plan)
        ? analysis.action_plan
            .slice(0, 3) // Only top 3
            .filter((item: any) => 
              item && 
              typeof item.priority === 'number' &&
              typeof item.action === 'string' &&
              typeof item.time_estimate === 'string'
            )
            .map((item: any) => ({
              priority: item.priority,
              action: item.action,
              time_estimate: item.time_estimate
            }))
        : []
      
      // Normalize skills match comparison
      const skillsMatchComparison: SkillsMatchComparisonItem[] = Array.isArray(analysis.skills_match_comparison)
        ? analysis.skills_match_comparison
            .filter((item: any) =>
              item &&
              typeof item.skill === 'string' &&
              ['strong', 'listed_but_not_demonstrated', 'missing'].includes(item.status) &&
              typeof item.evidence === 'string' &&
              ['✅', '⚠️', '❌'].includes(item.icon)
            )
            .map((item: any) => ({
              skill: item.skill,
              status: item.status as SkillsMatchComparisonItem['status'],
              evidence: item.evidence,
              icon: item.icon as SkillsMatchComparisonItem['icon'],
              suggestion: typeof item.suggestion === 'string' ? item.suggestion : ''
            }))
        : []
      
      // Normalize quick wins
      const quickWins: QuickWin[] = Array.isArray(analysis.quick_wins)
        ? analysis.quick_wins
            .filter((item: any) =>
              item &&
              typeof item.win === 'string' &&
              typeof item.impact === 'string'
            )
            .map((item: any) => ({
              win: item.win,
              impact: item.impact
            }))
        : []
      
      // Normalize missing keywords (with placement)
      const normalizeKeywordWithPlacement = (kw: any): KeywordWithPlacement | null => {
        if (!kw || typeof kw.keyword !== 'string') return null
        const whereToAdd = Array.isArray(kw.where_to_add)
          ? kw.where_to_add
              .filter((placement: any) =>
                placement &&
                ['experiences', 'projects', 'skills', 'certifications'].includes(placement.section) &&
                typeof placement.location === 'string' &&
                typeof placement.suggestion === 'string'
              )
              .map((placement: any) => ({
                section: placement.section as KeywordPlacement['section'],
                location: placement.location,
                suggestion: placement.suggestion
              }))
          : []
        if (whereToAdd.length === 0) return null
        return {
          keyword: kw.keyword,
          where_to_add: whereToAdd
        }
      }
      
      const missingKeywords: MissingKeywords = {
        critical: Array.isArray(analysis.missing_keywords?.critical)
          ? analysis.missing_keywords.critical
              .map(normalizeKeywordWithPlacement)
              .filter((kw: KeywordWithPlacement | null): kw is KeywordWithPlacement => kw !== null)
          : [],
        important: Array.isArray(analysis.missing_keywords?.important)
          ? analysis.missing_keywords.important
              .map(normalizeKeywordWithPlacement)
              .filter((kw: KeywordWithPlacement | null): kw is KeywordWithPlacement => kw !== null)
          : [],
        nice_to_have: Array.isArray(analysis.missing_keywords?.nice_to_have)
          ? analysis.missing_keywords.nice_to_have
              .map(normalizeKeywordWithPlacement)
              .filter((kw: KeywordWithPlacement | null): kw is KeywordWithPlacement => kw !== null)
          : []
      }
      
      // Normalize example edit
      const exampleEdit: ExampleEdit | null = analysis.example_edit && 
        typeof analysis.example_edit.section === 'string' &&
        ['experiences', 'projects', 'skills'].includes(analysis.example_edit.section) &&
        typeof analysis.example_edit.location === 'string' &&
        typeof analysis.example_edit.before === 'string' &&
        typeof analysis.example_edit.after === 'string' &&
        Array.isArray(analysis.example_edit.improvements)
        ? {
            section: analysis.example_edit.section as ExampleEdit['section'],
            location: analysis.example_edit.location,
            before: analysis.example_edit.before,
            after: analysis.example_edit.after,
            improvements: analysis.example_edit.improvements.filter((imp: any) => typeof imp === 'string')
          }
        : null
      
      // Normalize matched keywords
      const matchedKeywords = Array.isArray(analysis.matched_keywords) 
        ? analysis.matched_keywords.filter((k: any) => typeof k === 'string')
        : []
      
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
        key_insights: keyInsights,
        action_plan: actionPlan.length > 0 ? actionPlan : [
          { priority: 1, action: 'Review and incorporate missing keywords', time_estimate: '10 min' },
          { priority: 2, action: 'Add quantifiable metrics to achievements', time_estimate: '15 min' },
          { priority: 3, action: 'Enhance project descriptions with relevant technologies', time_estimate: '10 min' }
        ],
        skills_match_comparison: skillsMatchComparison.length > 0 ? skillsMatchComparison : [],
        quick_wins: quickWins.length > 0 ? quickWins : [
          { win: 'Highlight your strongest projects at the top', impact: 'Better alignment with job requirements' },
          { win: 'Add specific technologies mentioned in job description', impact: 'Increases ATS keyword matching' }
        ],
        missing_keywords: missingKeywords,
        example_edit: exampleEdit || {
          section: 'projects',
          location: 'Your projects section',
          before: 'Built an AI-powered system',
          after: 'Built a multi-agent AI system with Node.js backend, implementing observability with logging and tracing',
          improvements: ['Added multi-agent terminology', 'Specified Node.js backend', 'Included observability keywords']
        },
        detailed_analysis: normalizedDetailedAnalysis,
        pros,
        cons,
        matched_keywords: matchedKeywords,
        section_feedback: sectionFeedback
      }
      
      console.log('✅ Successfully parsed comprehensive analysis')
      return { success: true, analysis: normalizedAnalysis }
    } else {
      console.warn('⚠️ Failed to parse JSON, using fallback. Raw response:', analysisText.substring(0, 200))
      const fallbackAnalysis: ComprehensiveAnalysis = {
        ats_score: 70,
        status: 'Good Fit',
        key_insights: 'Your resume shows good potential alignment with this role',
        action_plan: [
          { priority: 1, action: 'Review and incorporate missing keywords', time_estimate: '10 min' },
          { priority: 2, action: 'Add quantifiable metrics to achievements', time_estimate: '15 min' },
          { priority: 3, action: 'Enhance project descriptions with relevant technologies', time_estimate: '10 min' }
        ],
        skills_match_comparison: [],
        quick_wins: [
          { win: 'Highlight your strongest projects at the top', impact: 'Better alignment with job requirements' }
        ],
        missing_keywords: { critical: [], important: [], nice_to_have: [] },
        example_edit: {
          section: 'projects',
          location: 'Your projects section',
          before: 'Built an AI-powered system',
          after: 'Built a multi-agent AI system with Node.js backend, implementing observability with logging and tracing',
          improvements: ['Added multi-agent terminology', 'Specified Node.js backend', 'Included observability keywords']
        },
        detailed_analysis: {
          content_quality: { score: 75, feedback: 'Content quality analysis' },
          skills_match: { score: 70, feedback: 'Skills match analysis' },
          structure_format: { score: 80, feedback: 'Structure and format analysis' },
          tone_style: { score: 75, feedback: 'Tone and style analysis' },
          experience_relevance: { score: 70, feedback: 'Experience relevance analysis' }
        },
        pros: ['Resume processed successfully'],
        cons: ['Analysis format parsing failed - please try again'],
        matched_keywords: [],
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

