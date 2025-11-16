import mammoth from 'mammoth'

export async function extractDocxText(buffer: Buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return {
      success: true,
      text: result.value,
      message: 'DOCX text extracted successfully',
      metadata: {
        fileSize: buffer.length,
        textLength: result.value.length
      }
    }
  } catch (error: any) {
    console.error('DOCX processing failed:', error)
    return {
      success: false,
      error: error.message || 'DOCX processing failed'
    }
  }
}

