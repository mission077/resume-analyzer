from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from markitdown import MarkItDown
import io
import os

app = FastAPI(title="MarkItDown API", version="1.0.0")

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

@app.get("/")
async def root():
    return {"message": "MarkItDown API is running"}

@app.post("/convert-to-markdown")
async def convert_to_markdown(file: UploadFile = File(...)):
    """
    Convert PDF file to Markdown using MarkItDown
    """
    try:
        # Read file content
        file_content = await file.read()
        
        # Create MarkItDown instance
        md = MarkItDown()
        
        # Convert file to markdown (convert_stream only takes the stream, not filename)
        result = md.convert_stream(io.BytesIO(file_content))
        
        return {
            "success": True,
            "text": result.text_content,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
