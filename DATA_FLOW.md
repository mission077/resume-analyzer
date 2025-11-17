# Data Flow Documentation

## Overview
This document explains how data flows through the application for both PDF and DOCX file uploads.

**Note:** Both PDF and DOCX files now follow the same unified flow using service layer architecture.

---

## 🔄 Unified Flow (PDF & DOCX)

### Step 1: User Uploads File
**File:** `components/userform/ResumeForm.tsx`
- User fills form: Company Name, Job Title, Job Description
- User uploads PDF or DOCX file via drag-and-drop
- Form validation happens
- `handleSubmit()` creates `FormData` with all fields
- Calls `onSubmit(formData)` callback

### Step 2: Form Submission
**File:** `app/(dashboard)/dashboard/userform/page.tsx`
- `onSubmit()` function receives `FormData`
- Sets loading state: `localStorage.setItem('resumeAnalysisLoading', 'true')`
- Navigates to loading page: `router.push('/dashboard/analysis/loading')`

### Step 3: Text Extraction
**API:** `POST /api/resume/extract`
**File:** `app/api/resume/extract/route.ts`
- Receives `FormData` with resume file
- Calls `extractFileText()` from `services/fileExtraction/index.ts`
- **For PDF files:**
  - `services/fileExtraction/pdfExtractor.ts` → FastAPI service
  - **FastAPI Service:** `services/markitdown-api/main.py`
    - Uses MarkItDown library to convert PDF to text
    - Returns: `{ success: true, text: "...", filename: "..." }`
- **For DOCX files:**
  - `services/fileExtraction/docxExtractor.ts` → Uses `mammoth` library
  - Extracts text directly (no external service)
- Returns extracted text

### Step 4: LLM Analysis
**API:** `POST /api/resume/analyze`
**File:** `app/api/resume/analyze/route.ts`
- Receives JSON with: `resumeText`, `companyName`, `jobTitle`, `jobDescription`
- Calls `analyzeResume()` from `services/analysis/resumeAnalyzer.ts`
- Uses `lib/llmParser.ts`:
  - `createAnalysisPrompt()` - Creates prompt with job context
  - Sends to Google Gemini AI
  - `extractJsonFromText()` - Parses JSON from response
- Returns complete analysis with job details

### Step 5: Store Results
**File:** `app/(dashboard)/dashboard/userform/page.tsx`
- Receives response from `/api/resume/analyze`:
  ```json
  {
    success: true,
    data: {
      analysis: { overallScore, strengths, gaps, recommendations, atsScore },
      companyName: "...",
      jobTitle: "...",
      jobDescription: "...",
      resumeText: "..."
    }
  }
  ```
- Stores in `localStorage`:
  ```javascript
  localStorage.setItem('analysisData', JSON.stringify({
    analysis: data.analysis,
    data: {
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      jobDescription: data.jobDescription,
      resumeText: data.resumeText
    }
  }))
  ```
- Sets loading to false
- Navigates to `/dashboard/analysis`

### Step 6: Display Results
**File:** `app/(dashboard)/dashboard/analysis/page.tsx`
- Reads from `localStorage.getItem('analysisData')`
- Parses and displays:
  - Job Details (Company, Title, Description)
  - Resume Preview (extracted text)
  - Analysis Results (Scores, Strengths, Gaps, Recommendations)

---

## 🏗️ Architecture Overview

### Service Layer Pattern

```
services/
├── fileExtraction/
│   ├── pdfExtractor.ts      # PDF extraction via MarkItDown API
│   ├── docxExtractor.ts     # DOCX extraction via mammoth
│   └── index.ts             # Unified extractFileText() interface
│
├── analysis/
│   ├── resumeAnalyzer.ts   # LLM analysis logic
│   └── index.ts             # Export interface
│
└── markitdown-api/          # FastAPI service (external)
    └── main.py
```

### API Routes (Thin Controllers)

```
app/api/resume/
├── extract/route.ts         # Text extraction endpoint
└── analyze/route.ts         # Analysis endpoint
```

### Utilities

```
lib/
├── llmParser.ts            # JSON parsing & prompt creation
└── utils.ts                # General utilities
```

---

## 🔑 Key Benefits of New Structure

1. **Unified Flow**: Both PDF and DOCX use the same two API endpoints
2. **Separation of Concerns**: 
   - API routes = thin controllers
   - Services = business logic
   - Utilities = pure functions
3. **Reusability**: Services can be used independently
4. **Testability**: Services can be unit tested easily
5. **Maintainability**: Clear structure, easy to find code

---

## 📁 File Locations Summary

### Frontend Components
- `components/userform/ResumeForm.tsx` - Form UI and file upload
- `app/(dashboard)/dashboard/userform/page.tsx` - Form submission logic
- `app/(dashboard)/dashboard/analysis/page.tsx` - Results display

### API Routes (Controllers)
- `app/api/resume/extract/route.ts` - Text extraction endpoint
- `app/api/resume/analyze/route.ts` - Analysis endpoint

### Services (Business Logic)
- `services/fileExtraction/pdfExtractor.ts` - PDF text extraction
- `services/fileExtraction/docxExtractor.ts` - DOCX text extraction
- `services/fileExtraction/index.ts` - Unified extraction interface
- `services/analysis/resumeAnalyzer.ts` - LLM analysis service

### Utilities
- `lib/llmParser.ts` - LLM prompt creation and JSON parsing

### External Service
- `services/markitdown-api/main.py` - FastAPI service for PDF conversion

---

## 🔄 Complete Flow Diagram

### Unified Flow (Both PDF & DOCX):
```
User Form 
  → userform/page.tsx 
  → POST /api/resume/extract 
    → services/fileExtraction/ 
      → PDF: FastAPI (MarkItDown) 
      → DOCX: mammoth library
  → POST /api/resume/analyze 
    → services/analysis/resumeAnalyzer.ts 
      → lib/llmParser.ts 
      → Gemini AI
  → localStorage 
  → analysis/page.tsx 
  → Display Results
```

---

## 💡 Why This Structure?

**Before:** Inconsistent - PDF used 1 API call, DOCX used 2 API calls. Business logic mixed with API routes.

**After:** Consistent - Both use 2 API calls (extract, then analyze). Clean separation:
- API routes = request/response handling
- Services = business logic
- Utilities = pure functions

This makes the codebase more maintainable, testable, and scalable!
