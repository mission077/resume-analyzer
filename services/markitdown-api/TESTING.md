# Testing Guide

## Prerequisites

1. **FastAPI Service Running**: The MarkItDown API should be running on `http://localhost:8000`
   ```bash
   cd services/markitdown-api
   source venv/bin/activate
   python main.py
   ```

2. **Next.js Dev Server Running**: Your Next.js app should be running (usually on `http://localhost:3000` or `http://localhost:3003`)
   ```bash
   npm run dev
   ```

## Testing Methods

### Method 1: Test FastAPI Service Directly (Quick Verification)

Test the MarkItDown API independently to ensure it's working:

```bash
curl -X POST "http://localhost:8000/convert-to-markdown" \
  -F "file=@/path/to/your/resume.pdf"
```

**Expected Response:**
```json
{
  "success": true,
  "text": "Extracted text content from PDF...",
  "filename": "resume.pdf"
}
```

### Method 2: Test via Next.js UI (Full Integration Test)

1. **Navigate to the resume upload form:**
   - Go to `http://localhost:3000/dashboard/userform` (or your Next.js port)

2. **Fill out the form:**
   - Upload a PDF resume file
   - Enter Company Name
   - Enter Job Title
   - Enter Job Description

3. **Submit the form:**
   - Click "Submit" button
   - You should see a loading screen
   - The system will:
     - Send PDF to FastAPI MarkItDown service for text extraction
     - Send extracted text to Gemini AI for analysis
     - Display the analysis results

4. **Check the browser console** (F12 → Console tab) for any errors

5. **Check the terminal** where FastAPI is running for processing logs

### Method 3: Test via API Route Directly

You can test the extraction endpoint:

```bash
# Extract text from file
curl -X POST "http://localhost:3000/api/resume/extract" \
  -F "resume=@/path/to/your/resume.pdf"

# Then analyze the extracted text
curl -X POST "http://localhost:3000/api/resume/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "extracted text here...",
    "companyName": "Test Company",
    "jobTitle": "Software Engineer",
    "jobDescription": "Test job description"
  }'
```

## Troubleshooting

### Issue: "MarkItDown API error: Connection refused"
- **Solution**: Make sure FastAPI service is running on port 8000
- Check: `curl http://localhost:8000/` should return `{"message": "MarkItDown API is running"}`

### Issue: CORS errors in browser console
- **Solution**: Check that your Next.js port is in the CORS allowed origins in `main.py`
- Current allowed: `["http://localhost:3000", "http://localhost:3003", "http://localhost:3004"]`

### Issue: "PDF processing failed"
- **Solution**: Check FastAPI terminal for error details
- Verify the PDF file is valid and not corrupted
- Check that MarkItDown dependencies are properly installed

### Issue: No text extracted
- **Solution**: Some PDFs (especially image-based/scanned) may not extract well
- Try with a text-based PDF first
- Check FastAPI response in browser Network tab

## Expected Flow

1. User uploads PDF/DOCX → `ResumeForm.tsx`
2. Form submits → `userform/page.tsx` → `onSubmit()`
3. API call → `/api/resume/extract` → `services/fileExtraction/`
4. Text extraction → PDF: FastAPI MarkItDown | DOCX: mammoth library
5. API call → `/api/resume/analyze` → `services/analysis/resumeAnalyzer.ts`
6. Analysis → Gemini AI → Returns analysis
7. Results → Stored in localStorage → Displayed on analysis page

## Success Indicators

✅ FastAPI service responds to health check  
✅ PDF upload completes without errors  
✅ Text is extracted from PDF (check Network tab in browser DevTools)  
✅ Analysis results are displayed  
✅ No errors in browser console  
✅ No errors in FastAPI terminal  

