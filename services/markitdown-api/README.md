# MarkItDown API Service

FastAPI service for converting PDF files to Markdown using MarkItDown.

## Prerequisites

- Python 3.10 or higher (Python 3.12 recommended)
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
uvicorn main:app --reload --port 8000
```

## Endpoints

- `GET /` - Health check
- `POST /convert-to-markdown` - Convert PDF to Markdown
  - Accepts: PDF file (multipart/form-data)
  - Returns: JSON with `success`, `text`, and `filename`

## Testing

Test with curl:
```bash
curl -X POST "http://localhost:8000/convert-to-markdown" \
  -F "file=@/path/to/your/resume.pdf"
```
