# Testing Guide

## Prerequisites

1. **LaTeX Installed**: Ensure LaTeX is installed and `pdflatex` is in your PATH
   - Check: `pdflatex --version` should work
   - If not, install MacTeX (macOS) or texlive-full (Linux)

2. **FastAPI Service Running**: The LaTeX Compiler API should be running on `http://localhost:8001`
   ```bash
   cd services/latex-compiler
   source venv/bin/activate
   python main.py
   ```

3. **Next.js Dev Server Running**: Your Next.js app should be running (usually on `http://localhost:3000` or `http://localhost:3003`)
   ```bash
   npm run dev
   ```

## Testing Methods

### Method 1: Test FastAPI Service Directly (Quick Verification)

Test the LaTeX Compiler API independently to ensure it's working:

```bash
curl -X POST "http://localhost:8001/compile-resume" \
  -H "Content-Type: application/json" \
  -d @test_resume_data.json \
  --output test_resume.pdf
```

**Expected Response:**
- A PDF file named `test_resume.pdf` should be created
- The PDF should contain formatted resume content

### Method 2: Test via Next.js UI (Full Integration Test)

1. **Navigate to the resume builder form:**
   - Go to `http://localhost:3003/dashboard/resumebuilder/build` (or your Next.js port)

2. **Fill out the form:**
   - Enter Personal Info (First Name, Last Name, Email, Phone)
   - Add Education entries
   - Add Experience entries
   - Add Projects
   - Add Skills
   - (Optional) Add Certifications and Extracurriculars

3. **Generate PDF:**
   - Click "Generate PDF" button
   - The system will:
     - Send resume data to FastAPI LaTeX service
     - Compile LaTeX template to PDF
     - Download the PDF file

4. **Check the browser console** (F12 → Console tab) for any errors

5. **Check the terminal** where FastAPI is running for compilation logs

### Method 3: Test via API Route Directly

You can test the PDF generation endpoint:

```bash
curl -X POST "http://localhost:3003/api/resume/generate-pdf" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your-jwt-token" \
  -d '{
    "title": "Test Resume",
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "555-1234"
    },
    "education": [...],
    "experiences": [...],
    "projects": [...],
    "skills": {...}
  }' \
  --output resume.pdf
```

## Troubleshooting

### Issue: "LaTeX Compiler API error: Connection refused"
- **Solution**: Make sure FastAPI service is running on port 8001
- Check: `curl http://localhost:8001/` should return `{"message": "LaTeX Compiler API is running"}`

### Issue: "pdflatex not found"
- **Solution**: Install LaTeX distribution
  - macOS: `brew install --cask mactex`
  - Linux: `sudo apt-get install texlive-full`
- Verify: `pdflatex --version` should work

### Issue: CORS errors in browser console
- **Solution**: Check that your Next.js port is in the CORS allowed origins in `main.py`
- Current allowed: `["http://localhost:3000", "http://localhost:3003", "http://localhost:3004"]`

### Issue: "LaTeX compilation failed"
- **Solution**: Check FastAPI terminal for LaTeX error details
- Common issues:
  - Missing LaTeX packages (should be included in template)
  - Invalid characters in resume data (special characters may need escaping)
  - Template syntax errors

### Issue: PDF is empty or malformed
- **Solution**: Check FastAPI terminal for compilation warnings
- Verify the resume data structure matches the template expectations
- Check that all required fields are present

## Expected Flow

1. User fills resume form → `resumebuilder/build/page.tsx`
2. User clicks "Generate PDF" → `handleGeneratePDF()`
3. API call → `/api/resume/generate-pdf` → `services/resumeGeneration/latexCompiler.ts`
4. PDF generation → FastAPI LaTeX service (port 8001)
5. LaTeX compilation → `pdflatex` compiles template.tex
6. PDF download → Returns PDF file to browser

## Success Indicators

✅ FastAPI service responds to health check  
✅ LaTeX compilation completes without errors  
✅ PDF file is generated and downloaded  
✅ PDF contains formatted resume content  
✅ No errors in browser console  
✅ No errors in FastAPI terminal  

