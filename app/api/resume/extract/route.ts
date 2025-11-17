import { NextRequest, NextResponse } from 'next/server'
import { extractFileText } from '@/services/fileExtraction'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const resume = formData.get('resume') as File

    if (!resume) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    const extractionResult = await extractFileText(resume)

    if (!extractionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'File extraction failed',
          message: extractionResult.error
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Text extracted successfully',
      data: {
        resumeText: extractionResult.text,
        resumeFileName: resume.name,
        metadata: extractionResult.metadata
      }
    })
  } catch (error: any) {
    console.error('Error extracting file text:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to extract text', message: error.message },
      { status: 500 }
    )
  }
}

