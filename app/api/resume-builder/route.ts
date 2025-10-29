import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { convertPdfToImage } from '@/lib/pdfToImage'
import { GoogleGenerativeAI } from "@google/generative-ai"

// Extracting the text from either PDF or DOCX file 
const extractFileText = async (file) => {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ""
    
    if (file.type === 'application/pdf') {
      const pdfBuffer = Buffer.from(await file.arrayBuffer())
      const result = await convertPdfToImage(pdfBuffer)
      
      if (result.success) {
        extractedText = result.text
      } else {
        throw new Error(result.error || 'PDF processing failed')
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      throw new Error('Unsupported file type. Please upload PDF or DOCX files only.')
    }

    return extractedText
  } catch (error) {
    console.error("File extraction failed:", error)
    throw error
  }
}

// Analyze the resume with PDF file ONLY in one API call
const analyzeResumeWithLLM = async (resumeText: string, companyName: string, jobTitle: string, jobDescription: string) => {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY')
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
    
    const prompt = `You are an expert resume and job-fit analyst.
    Analyze this resume against the job requirements and provide comprehensive feedback:

    Company: ${companyName}
    Job Title: ${jobTitle}
    Job Description: ${jobDescription}

    Resume Text:
    ${resumeText}

    Provide analysis in this JSON format:
    {
      "overallScore": 85,
      "strengths": ["strength1", "strength2", "strength3"],
      "gaps": ["gap1", "gap2", "gap3"],
      "recommendations": ["rec1", "rec2", "rec3"],
      "atsScore": 78
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysisText = response.text() || 'No analysis generated'
    
    try {
      const analysis = JSON.parse(analysisText)
      return { success: true, analysis }
    } catch (parseError) {
      const fallbackAnalysis = {
        overallScore: 75,
        strengths: ["Resume processed successfully"],
        gaps: ["Analysis format parsing failed"],
        recommendations: ["Please review the analysis manually"],
        atsScore: 70
      }
      return { 
        success: true, 
        analysis: fallbackAnalysis
      }
    }
  } catch (error: any) {
    console.error('Resume analysis failed:', error)
    return { 
      success: false, 
      error: error.message || 'Analysis failed' 
    }
  }
}

export async function POST(request) {
  try {
    // Parse FormData from the request
    const formData = await request.formData()

    // Get the form data
    const companyName = formData.get('companyName')
    const jobTitle = formData.get('jobTitle')
    const jobDescription = formData.get('jobDescription')
    const resume = formData.get('resume')

    // Extract text from the resume 
    let resumeText = ""
    let extractionError = null
    try {
      resumeText = await extractFileText(resume)
    } catch (extractError) {
      console.error("File extraction failed:", extractError)
      extractionError = extractError.message || "Failed to extract text from file"
      resumeText = ""
    }
    
    if (extractionError) {
      return NextResponse.json({
        success: false,
        error: "File processing failed",
        message: extractionError,
        data: {
          companyName,
          jobTitle,
          jobDescription,
          resumeFileName: resume?.name || "No file",
          resumeText: ""
        }
      }, { status: 400 })
    }
    
    // For PDF files, perform complete analysis in one API call
    if (resume.type === 'application/pdf') {
      const analysisResult = await analyzeResumeWithLLM(resumeText, companyName, jobTitle, jobDescription)
      
      if (analysisResult.success) {
        return NextResponse.json({
          success: true,
          message: "PDF resume analyzed successfully!",
          data: {
            companyName,
            jobTitle,
            jobDescription,
            resumeFileName: resume?.name || "No file",
            resumeText,
            analysis: analysisResult.analysis
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: "Analysis failed",
          message: analysisResult.error,
          data: {
            companyName,
            jobTitle,
            jobDescription,
            resumeFileName: resume?.name || "No file",
            resumeText
          }
        }, { status: 500 })
      }
    }
    
    // For DOCX files, return extracted text for separate analysis in (data-analysis) API call
    return NextResponse.json({
      success: true,
      message: "Resume processed successfully!",
      data: {
        resumeText
      }
    })
  } catch (error) {
    console.error('Error processing form data:', error)
    return NextResponse.json({ error: 'Failed to process form data' }, { status: 500 })
  }
}
