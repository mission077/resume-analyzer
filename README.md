# Resume Analyzer

A web application that helps users analyze resumes for skills, experience, and other key metrics. Built using Next.js with Supabase for backend services and MarkItDown for PDF text extraction.

## Features

- Upload and analyze resumes (PDF and DOCX formats)
- Extract key skills and experience automatically using MarkItDown
- AI-powered resume analysis using Google Gemini AI
- User authentication and authorization via Clerk
- Clean, responsive UI built with modern web technologies

## Project Structure

```
resume-analyzer/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/        # Dashboard routes
│   └── api/               # API routes
│       └── resume/        # Resume processing endpoints
│           ├── extract/   # Text extraction endpoint
│           └── analyze/  # Analysis endpoint
├── components/            # React components
├── lib/                   # Utility functions
│   └── llmParser.ts      # LLM JSON parsing utilities
├── services/              # Service layer (business logic)
│   ├── fileExtraction/   # File extraction services
│   │   ├── pdfExtractor.ts
│   │   └── docxExtractor.ts
│   ├── analysis/          # Analysis services
│   │   └── resumeAnalyzer.ts
│   └── markitdown-api/    # FastAPI service for PDF conversion
├── middleware.ts          # Next.js middleware
└── package.json           # Node.js dependencies
```

## Getting Started

### Prerequisites

**Node.js & npm:**
- Node.js (v18+ recommended)
- npm or yarn

**Python (for MarkItDown service):**
- Python 3.10 or higher (Python 3.12 recommended)
- pip

**Services:**
- Supabase account for backend services
- Clerk account for authentication
- Google Generative AI API key for resume analysis

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/mission077/resume-analyzer.git
cd resume-analyzer
```

2. **Install Node.js dependencies:**
```bash
npm install
```

3. **Set up MarkItDown API service:**

```bash
cd services/markitdown-api

# Create virtual environment with Python 3.12
python3.12 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

4. **Create a `.env.local` file** in the root directory with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Clerk
NEXT_PUBLIC_CLERK_FRONTEND_API=<your-clerk-frontend-api>
CLERK_API_KEY=<your-clerk-api-key>

# Google Generative AI
GOOGLE_GENERATIVE_AI_API_KEY=<your-google-ai-api-key>

# MarkItDown API (optional - defaults to http://localhost:8000)
MARKITDOWN_API_URL=http://localhost:8000
```

### Running the Application

1. **Start the MarkItDown API service** (in a separate terminal):

```bash
cd services/markitdown-api
source venv/bin/activate
python main.py
```

The service will run on `http://localhost:8000`

2. **Start the Next.js development server** (in another terminal):

```bash
npm run dev
```

3. **Open your browser:**
- Navigate to `http://localhost:3000` (or the port shown in terminal)

## How It Works

1. **File Upload**: User uploads a PDF or DOCX resume through the web interface
2. **Text Extraction**: 
   - **PDF**: Sent to MarkItDown FastAPI service which converts it to text
   - **DOCX**: Extracted using mammoth library
3. **Analysis**: Extracted text is analyzed by Google Gemini AI against job requirements
4. **Results**: Analysis results (scores, strengths, gaps, recommendations) are displayed

**Note:** Both PDF and DOCX files follow the same unified flow using two API endpoints: `/api/resume/extract` and `/api/resume/analyze`

## Technologies Used

### Frontend & Backend
- **Next.js** – React framework for frontend and server-side rendering
- **TypeScript** – Type safety for the entire project
- **TailwindCSS** – Utility-first CSS framework
- **React Dropzone** – File upload component

### Services
- **Supabase** – Backend services including database
- **Clerk** – User authentication and authorization
- **Google Gemini AI** – Resume analysis and insights
- **MarkItDown** – PDF to text conversion (via FastAPI)

### Python Service
- **FastAPI** – Python web framework for MarkItDown API
- **MarkItDown** – Microsoft's document conversion library
- **pdfminer-six** – PDF text extraction library

## Development

### Running MarkItDown Service

The MarkItDown service must be running for PDF processing to work:

```bash
cd services/markitdown-api
source venv/bin/activate
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

### Testing

See `services/markitdown-api/TESTING.md` for detailed testing instructions.

## Troubleshooting

### MarkItDown Service Not Running
- Ensure the FastAPI service is running on port 8000
- Check that Python virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`

### PDF Processing Fails
- Check that `pdfminer-six` is installed in the virtual environment
- Verify the PDF file is not corrupted
- Check FastAPI terminal for error messages

### CORS Errors
- Ensure your Next.js port is in the CORS allowed origins in `services/markitdown-api/main.py`

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit your changes (`git commit -m "Add some feature"`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Create a Pull Request

## License

[Add your license here]

