export async function extractPdfText(pdfBuffer: Buffer) {
  try {
    const markitdownApiUrl = process.env.MARKITDOWN_API_URL || 'http://localhost:8000'
    
    const formData = new FormData()
    const fileBlob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' })
    formData.append('file', fileBlob, 'resume.pdf')
    
    const response = await fetch(`${markitdownApiUrl}/convert-to-markdown`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`MarkItDown API error: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'PDF conversion failed')
    }
    
    return {
      success: true,
      text: result.text || '',
      message: 'PDF text extracted successfully using MarkItDown',
      metadata: {
        fileSize: pdfBuffer.length,
        textLength: result.text?.length || 0,
        filename: result.filename
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

