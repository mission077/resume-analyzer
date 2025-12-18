import { NextRequest, NextResponse } from 'next/server'
import { generateLiveFeedback } from '@/services/analysis/liveFeedback'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sectionName, sectionContent, fullResumeContext, jobContext } = body

    if (!sectionName) {
      return NextResponse.json(
        { success: false, error: 'Section name is required' },
        { status: 400 }
      )
    }

    if (typeof sectionContent !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Section content must be a string' },
        { status: 400 }
      )
    }

    console.log('🤖 Generating live feedback for section:', sectionName)

    const result = await generateLiveFeedback(
      sectionName,
      sectionContent,
      fullResumeContext,
      jobContext
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Feedback generation failed',
          message: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      feedback: result.feedback
    })
  } catch (error: any) {
    console.error('Error generating live feedback:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate feedback', message: error.message },
      { status: 500 }
    )
  }
}
