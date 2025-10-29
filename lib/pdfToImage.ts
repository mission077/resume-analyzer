import { GoogleGenerativeAI } from "@google/generative-ai"

export async function convertPdfToImage(pdfBuffer: Buffer) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY')
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
    
    const base64Pdf = pdfBuffer.toString('base64')
    
    const result = await model.generateContent([
      {
        text: `Extract all text content from this PDF document. Preserve structure, formatting, and organization. Return only readable text content with proper line breaks and paragraphs.`
      },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Pdf
        }
      }
    ])
    
    const response = await result.response
    const extractedText = response.text()
    
    return {
      success: true,
      text: extractedText,
      message: 'PDF text extracted successfully',
      metadata: {
        fileSize: pdfBuffer.length,
        textLength: extractedText.length
      }
    }
  } catch (error: any) {
    console.error('PDF processing failed:', error)
    return {
      success: false,
      error: error.message || 'PDF processing failed'
    }
  }
}