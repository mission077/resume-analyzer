import { NextRequest, NextResponse } from 'next/server'
import { analyzeResume } from '@/services/analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeText, companyName, jobTitle, jobDescription } = body

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: 'Resume text is required' },
        { status: 400 }
      )
    }

    console.log('🤖 Starting LLM analysis...')
    const analysisResult = await analyzeResume(resumeText, companyName, jobTitle, jobDescription)

    if (!analysisResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis failed',
          message: analysisResult.error
        },
        { status: 500 }
      )
    }

    console.log('✅ Analysis complete:', JSON.stringify(analysisResult.analysis, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Analysis completed successfully',
      data: {
        analysis: analysisResult.analysis,
        companyName: companyName || null,
        jobTitle: jobTitle || null,
        jobDescription: jobDescription || null,
        resumeText: resumeText
      }
    })
  } catch (error: any) {
    console.error('Error analyzing resume:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze resume', message: error.message },
      { status: 500 }
    )
  }
}

