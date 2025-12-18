from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from jinja2 import Template
import subprocess
import tempfile
import os
import json
import re
import shutil
from pathlib import Path

app = FastAPI(title="LaTeX Compiler API", version="1.0.0")

# CORS origins - supports both local development and production
# Set ALLOWED_ORIGINS environment variable in production (comma-separated)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    # Production: use environment variable
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",")]
else:
    # Development: default localhost origins
    allowed_origins = ["http://localhost:3000", "http://localhost:3003", "http://localhost:3004"]

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the directory where this script is located
BASE_DIR = Path(__file__).parent
TEMPLATE_PATH = BASE_DIR / "template.tex"

def find_pdflatex():
    """
    Find pdflatex executable in common locations
    Returns the path to pdflatex or None if not found
    """
    # First, try to find it in PATH
    pdflatex_path = shutil.which("pdflatex")
    if pdflatex_path:
        return pdflatex_path
    
    # Common MacTeX locations
    common_paths = [
        "/Library/TeX/texbin/pdflatex",
        "/usr/local/texlive/2024/bin/universal-darwin/pdflatex",
        "/usr/local/texlive/2023/bin/universal-darwin/pdflatex",
        "/usr/local/texlive/2022/bin/universal-darwin/pdflatex",
        "/usr/local/texlive/2021/bin/universal-darwin/pdflatex",
        "/usr/local/texlive/2020/bin/universal-darwin/pdflatex",
    ]
    
    # Also check for arm64 (Apple Silicon) paths and 2025
    if os.uname().machine == "arm64":
        arm64_paths = [
            "/Library/TeX/texbin/pdflatex",
            "/usr/local/texlive/2025/bin/arm64-darwin/pdflatex",
            "/usr/local/texlive/2024/bin/arm64-darwin/pdflatex",
            "/usr/local/texlive/2023/bin/arm64-darwin/pdflatex",
        ]
        common_paths = arm64_paths + common_paths
    
    # Add 2025 paths for universal-darwin too
    common_paths.insert(0, "/usr/local/texlive/2025/bin/universal-darwin/pdflatex")
    
    for path in common_paths:
        if os.path.exists(path) and os.access(path, os.X_OK):
            return path
    
    return None

def convert_markdown_bold_to_latex(text: str) -> str:
    """
    Convert markdown bold (**text**) to LaTeX bold (\\textbf{text})
    Also escape LaTeX special characters
    """
    # Pattern to match **text** (non-greedy)
    pattern = r'\*\*(.*?)\*\*'
    replacement = r'\\textbf{\1}'
    text = re.sub(pattern, replacement, text)
    
    # Escape LaTeX special characters that might cause issues
    # % is a comment character, $ is math mode, etc.
    # But we need to be careful not to escape things inside \textbf{}
    # For now, just escape % and $ outside of commands
    text = text.replace('%', '\\%')
    text = text.replace('$', '\\$')
    
    return text

@app.get("/")
async def root():
    return {"message": "LaTeX Compiler API is running"}

@app.post("/compile-resume")
async def compile_resume(resume_data: dict):
    """
    Compile resume data into PDF using LaTeX template
    
    Accepts: JSON with resume data matching ResumeData interface
    Returns: PDF file (binary)
    """
    try:
        # Validate template exists
        if not TEMPLATE_PATH.exists():
            raise HTTPException(
                status_code=500,
                detail=f"LaTeX template not found at {TEMPLATE_PATH}"
            )
        
        # Read LaTeX template
        with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
            template_content = f.read()
        
        # Process resume data: convert markdown bold to LaTeX in description arrays
        processed_data = resume_data.copy()
        
        # Process experiences
        if "experiences" in processed_data:
            for exp in processed_data["experiences"]:
                if "description" in exp and isinstance(exp["description"], list):
                    exp["description"] = [convert_markdown_bold_to_latex(bullet) for bullet in exp["description"]]
        
        # Process projects
        if "projects" in processed_data:
            for proj in processed_data["projects"]:
                if "description" in proj and isinstance(proj["description"], list):
                    proj["description"] = [convert_markdown_bold_to_latex(bullet) for bullet in proj["description"]]
        
        # Process extracurriculars
        if "extracurriculars" in processed_data:
            for extra in processed_data["extracurriculars"]:
                if "description" in extra and extra["description"]:
                    extra["description"] = convert_markdown_bold_to_latex(extra["description"])
                if "bullets" in extra and isinstance(extra["bullets"], list):
                    extra["bullets"] = [convert_markdown_bold_to_latex(bullet) for bullet in extra["bullets"]]
        
        # Create Jinja2 template with custom delimiters to avoid LaTeX conflicts
        from jinja2 import Environment
        
        def capitalize_first(s):
            """Capitalize only the first letter of a string"""
            if not s:
                return s
            return s[0].upper() + s[1:] if len(s) > 1 else s.upper()
        
        env = Environment(
            block_start_string='<%',
            block_end_string='%>',
            variable_start_string='<<',
            variable_end_string='>>',
            comment_start_string='<#',
            comment_end_string='#>'
        )
        env.filters['capitalize_first'] = capitalize_first
        try:
            template = env.from_string(template_content)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Template syntax error: {str(e)}"
            )
        
        # Render template with processed resume data
        try:
            latex_content = template.render(**processed_data)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Template rendering error: {str(e)}"
            )
        
        # Create temporary directory for compilation
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_tex_path = os.path.join(temp_dir, "resume.tex")
            temp_pdf_path = os.path.join(temp_dir, "resume.pdf")
            
            # Write LaTeX file
            with open(temp_tex_path, "w", encoding="utf-8") as f:
                f.write(latex_content)
            
            # Debug: Save generated LaTeX for inspection
            with open("/tmp/generated_resume.tex", "w", encoding="utf-8") as f:
                f.write(latex_content)
            
            # Find pdflatex executable
            pdflatex_path = find_pdflatex()
            if not pdflatex_path:
                raise HTTPException(
                    status_code=500,
                    detail="pdflatex not found. Please install LaTeX (e.g., MacTeX on macOS: brew install --cask mactex)"
                )
            
            # Compile LaTeX to PDF (run pdflatex twice for references)
            try:
                # First compilation
                result = subprocess.run(
                    [pdflatex_path, "-interaction=nonstopmode", "-output-directory", temp_dir, temp_tex_path],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd=temp_dir
                )
                
                # Check if PDF was created (this is the real indicator of success)
                # Some pdflatex versions return non-zero even on success, so check for PDF file
                if not os.path.exists(temp_pdf_path):
                    # Check for actual errors in output
                    if 'Fatal error' in result.stdout or ('!' in result.stdout and 'Error' in result.stdout):
                        error_lines = [line for line in result.stdout.split('\n') if '!' in line or 'Error' in line or 'Fatal' in line]
                        error_msg = '\n'.join(error_lines[-10:])  # Last 10 error lines
                        raise HTTPException(
                            status_code=500,
                            detail=f"LaTeX compilation failed: {error_msg[:500]}"
                        )
                    else:
                        # PDF not created but no obvious error - might be a warning
                        raise HTTPException(
                            status_code=500,
                            detail="PDF file was not generated. Check LaTeX output for warnings."
                        )
                
                # Second compilation (for references/cross-references)
                # Only check return code, PDF should already exist from first compilation
                result2 = subprocess.run(
                    [pdflatex_path, "-interaction=nonstopmode", "-output-directory", temp_dir, temp_tex_path],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd=temp_dir
                )
                
                # Final check: PDF must exist
                if not os.path.exists(temp_pdf_path):
                    # If PDF doesn't exist after second compilation, something went wrong
                    error_msg = result2.stderr if result2.stderr else result2.stdout[-500:]
                    if 'Fatal error' in result2.stdout or 'Error' in result2.stdout:
                        error_lines = [line for line in result2.stdout.split('\n') if '!' in line or 'Error' in line or 'Fatal' in line]
                        error_msg = '\n'.join(error_lines[-10:])
                    if not error_msg:
                        error_msg = "PDF file was not generated after compilation"
                    raise HTTPException(
                        status_code=500,
                        detail=f"LaTeX compilation failed: {error_msg[:500]}"
                    )
                
                # Read PDF into memory before temp directory is deleted
                with open(temp_pdf_path, "rb") as pdf_file:
                    pdf_content = pdf_file.read()
                
                # Create a new temporary file to return (outside the context manager)
                import tempfile as tf
                final_temp_file = tf.NamedTemporaryFile(delete=False, suffix=".pdf")
                final_temp_file.write(pdf_content)
                final_temp_file.close()
                
                # Return PDF file
                return FileResponse(
                    final_temp_file.name,
                    media_type="application/pdf",
                    filename="resume.pdf"
                )
                
            except subprocess.TimeoutExpired:
                raise HTTPException(
                    status_code=500,
                    detail="LaTeX compilation timed out"
                )
            except FileNotFoundError:
                raise HTTPException(
                    status_code=500,
                    detail="pdflatex not found. Please install LaTeX (e.g., MacTeX on macOS: brew install --cask mactex)"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"LaTeX compilation error: {str(e)}"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compile resume: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

