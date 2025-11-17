import { extractPdfText } from './pdfExtractor'
import { extractDocxText } from './docxExtractor'

export interface ExtractionResult {
  success: boolean
  text?: string
  message?: string
  metadata?: {
    fileSize: number
    textLength?: number
    filename?: string
  }
  error?: string
}

export async function extractFileText(file: File): Promise<ExtractionResult> {
  const buffer = Buffer.from(await file.arrayBuffer())
  
  if (file.type === 'application/pdf') {
    console.log('📄 Processing PDF file via MarkItDown...')
    const result = await extractPdfText(buffer)
    
    if (result.success) {
      console.log(`✅ PDF text extracted successfully (${result.text?.length || 0} characters)`)
      console.log(`📝 First 200 chars: ${result.text?.substring(0, 200)}...`)
    }
    
    return result
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    console.log('📄 Processing DOCX file via mammoth...')
    const result = await extractDocxText(buffer)
    
    if (result.success) {
      console.log(`✅ DOCX text extracted successfully (${result.text?.length || 0} characters)`)
    }
    
    return result
  } else {
    return {
      success: false,
      error: 'Unsupported file type. Please upload PDF or DOCX files only.'
    }
  }
}

export { extractPdfText, extractDocxText }

