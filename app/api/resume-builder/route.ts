import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
// import pdf from 'pdf-parse' // This is not working, so we are not using it

const extractFileText = async (file) => {
  console.log("📄 Starting file extraction for:", file.name, "Type:", file.type)
  
  try {
    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    let extractedText = ""
    
    // Extract the text from the file
    if (file.type === 'application/pdf') {
      console.log("📄 Processing PDF file...")
      // For now, provide a helpful message for PDF files
      extractedText = `PDF file received: ${file.name} (${file.size} bytes)

Note: PDF text extraction is currently being set up. For now, please:
1. Convert your PDF to DOCX format, or
2. Copy and paste the text content into the job description field

This will be fully supported soon!`
      console.log("⚠️ PDF processing - using informative message")
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      throw new Error('Unsupported file type. Please upload PDF or DOCX files only.')
    }

    return extractedText
  } catch (error) {
    console.error("❌ Error in extractPdfText:", error)
    throw error
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

    // Test without file processing first
    console.log("🔄 Testing file object...")
    console.log("File details:", {
      name: resume.name,
      type: resume.type,
      size: resume.size,
      hasArrayBuffer: typeof resume.arrayBuffer === 'function'
    })
    
    // Start extracting the text from the resume 
    let resumeText = ""
    try {
      resumeText = await extractFileText(resume)
    } catch (extractError) {
      resumeText = "Failed to extract text from file"
    }

    console.log('Form data received:', { companyName, jobTitle, jobDescription, resume: resume.name, resumeTextLength: resumeText.length })
    
    // Return a simple success response
    return NextResponse.json({
      success: true,
      message: "Form data received successfully!",
      data: {
        companyName,
        jobTitle,
        jobDescription,
        resumeFileName: resume?.name || "No file",
        resumeText
      }
    })
  
  } catch (error) {
    console.error('Error processing form data:', error)
    return NextResponse.json({ error: 'Failed to process form data' }, { status: 500 })
  }
}
