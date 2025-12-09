# RESUMIZE

A web application that helps users analyze resumes for skills, experience, and other key metrics. Built using Next.js with Supabase for backend services and MarkItDown for PDF text extraction.

## Features

- Upload and analyze resumes (PDF and DOCX formats)
- Extract key skills and experience automatically using MarkItDown
- AI-powered resume analysis using Google Gemini AI
- User authentication and authorization via JWT
- Clean, responsive UI built with modern web technologies

## Getting Started

### Prerequisites

**Node.js & npm:**
- Node.js (v18+ recommended)
- npm or yarn

**Python (for MarkItDown service):**
- Python 3.10 or higher (Python 3.12 recommended)
- pip

**Services:**
- Docker and Docker Compose (recommended)
- PostgreSQL database (included in Docker, or use external)
- Google Generative AI API key for resume analysis

### Installation

#### Option 1: Using Docker (Recommended)

1. **Install Docker and Docker Compose:**
   - Download from [docker.com](https://www.docker.com/get-started)
   - Ensure Docker Desktop is running

2. **Clone the repository:**
```bash
git clone https://github.com/mission077/resume-analyzer.git
cd resume-analyzer
```

3. **Create a `.env.local` file** in the root directory with your credentials:

```env
# Database Configuration
# Option 1: Use DATABASE_URL (for Vercel Postgres, Supabase, Neon, etc.)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Option 2: Use individual connection parameters
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=resume_analyzer
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=resume_analyzer
DB_HOST=localhost
DB_PORT=5432

# Authentication
JWT_SECRET=your-very-secure-random-secret-key-change-this
NEXTAUTH_SECRET=another-random-secret-key-change-this

# Google Generative AI
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Python Services URLs (for local development)
MARKITDOWN_API_URL=http://localhost:8000
NEXT_PUBLIC_LATEX_API_URL=http://localhost:8001
```

**Note**: For production, update `MARKITDOWN_API_URL` and `NEXT_PUBLIC_LATEX_API_URL` to your deployed service URLs.

4. **Start all services with Docker:**
```bash
docker-compose up --build
```

This will automatically:
- Set up PostgreSQL database
- Build and run MarkItDown API service (port 8000)
- Build and run LaTeX Compiler service (port 8001)
- Build and run Next.js application (port 3000)
- Run database migrations automatically on first startup (via `/docker-entrypoint-initdb.d`)

**Note**: If you need to run migrations manually (e.g., after updating migration files):
```bash
docker-compose exec app psql $DATABASE_URL -f /app/migrations/001_init.sql
docker-compose exec app psql $DATABASE_URL -f /app/migrations/002_add_resumes_table.sql
docker-compose exec app psql $DATABASE_URL -f /app/migrations/003_add_comprehensive_analysis.sql
```

5. **Open your browser:**
- Navigate to `http://localhost:3000`

**To stop all services:**
```bash
docker-compose down
```

#### Option 2: Manual Setup (Without Docker)

If you prefer to run services manually:

1. **Install Node.js dependencies:**
```bash
npm install
```

2. **Set up Python services:**

**MarkItDown API service:**
```bash
cd services/markitdown-api
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

**LaTeX Compiler service:**
```bash
cd services/latex-compiler
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

**Note**: LaTeX Compiler requires LaTeX installed:
- **macOS**: `brew install --cask mactex`
- **Linux**: `sudo apt-get install texlive-full`
- **Windows**: Install MiKTeX or TeX Live

3. **Set up PostgreSQL database:**
   - Install and start PostgreSQL
   - Run migrations:
   ```bash
   psql $DATABASE_URL -f migrations/001_init.sql
   psql $DATABASE_URL -f migrations/002_add_resumes_table.sql
   psql $DATABASE_URL -f migrations/003_add_comprehensive_analysis.sql
   ```

4. **Start services:**
   - MarkItDown API: `cd services/markitdown-api && source venv/bin/activate && python main.py`
   - LaTeX Compiler: `cd services/latex-compiler && source venv/bin/activate && python main.py`
   - Next.js: `npm run dev`

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
- **PostgreSQL** – Database for user data and resume analyses
- **JWT Authentication** – Secure user authentication with httpOnly cookies
- **Google Gemini AI** – Resume analysis and insights
- **MarkItDown** – PDF to text conversion (via FastAPI)
- **LaTeX Compiler** – Professional PDF resume generation

### Python Service
- **FastAPI** – Python web framework for MarkItDown API
- **MarkItDown** – Microsoft's document conversion library
- **pdfminer-six** – PDF text extraction library

## Development

### Running Services

**With Docker (Recommended):**
```bash
docker-compose up --build
```

**Without Docker:**
- MarkItDown Service: `cd services/markitdown-api && source venv/bin/activate && python main.py`
- LaTeX Compiler: `cd services/latex-compiler && source venv/bin/activate && python main.py`
- Next.js: `npm run dev`

### Testing

See `services/markitdown-api/TESTING.md` for detailed testing instructions.

## Troubleshooting

### Docker Issues
- Ensure Docker Desktop is running
- Check container status: `docker-compose ps`
- View logs: `docker-compose logs [service-name]`
- Rebuild containers: `docker-compose up --build`

### MarkItDown Service Not Running (Manual Setup)
- Ensure the FastAPI service is running on port 8000
- Check that Python virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`

### LaTeX Compiler Service Not Running (Manual Setup)
- Ensure the FastAPI service is running on port 8001
- Verify LaTeX is installed on your system (`pdflatex --version`)
- Check that Python virtual environment is activated
- **Note**: With Docker, LaTeX is automatically installed in the container

### PDF Processing Fails
- Check that MarkItDown service is running
- Verify the PDF file is not corrupted
- Check FastAPI terminal for error messages

### Database Connection Errors
- Verify PostgreSQL is running
- Check that `DATABASE_URL` or database connection parameters are correct
- Ensure migrations have been run

### CORS Errors
- Ensure your Next.js port is in the `ALLOWED_ORIGINS` environment variable for Python services
- Check `services/markitdown-api/main.py` and `services/latex-compiler/main.py`

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit your changes (`git commit -m "Add some feature"`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Create a Pull Request

## License

MIT License

