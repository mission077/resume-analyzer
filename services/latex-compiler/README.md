# LaTeX Compiler API Service

FastAPI service for compiling resume data into PDF using LaTeX templates.

## Prerequisites

- Python 3.10 or higher (Python 3.12 recommended)
- LaTeX distribution installed:
  - **macOS**: Install MacTeX via Homebrew:
    ```bash
    brew install --cask mactex
    ```
  - **Linux**: Install TeX Live:
    ```bash
    sudo apt-get install texlive-full
    ```
  - **Windows**: Install MiKTeX or TeX Live

- If you don't have Python 3.12, install it via Homebrew:
  ```bash
  brew install python@3.12
  ```

## Setup

1. Create virtual environment with Python 3.12:
```bash
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Upgrade pip (recommended):
```bash
pip install --upgrade pip
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the service:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8001
```

## Endpoints

- `GET /` - Health check
- `POST /compile-resume` - Compile resume data to PDF
  - Accepts: JSON with resume data (matching `ResumeData` interface)
  - Returns: PDF file (binary)

## Testing

See `TESTING.md` for detailed testing instructions.

Test with curl:
```bash
curl -X POST "http://localhost:8001/compile-resume" \
  -H "Content-Type: application/json" \
  -d @test_resume_data.json \
  --output resume.pdf
```

## Notes

- The service uses port **8001** (MarkItDown API uses 8000)
- LaTeX compilation may take a few seconds
- Ensure `pdflatex` is in your PATH after installing LaTeX

