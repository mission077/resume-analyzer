#!/usr/bin/env python3
"""
Simple test script for LaTeX Compiler API
Tests the /compile-resume endpoint with sample data
"""

import requests
import json
import sys
from pathlib import Path

# Load test data
TEST_DATA_PATH = Path(__file__).parent / "test_resume_data.json"

def test_compile_resume():
    """Test the /compile-resume endpoint"""
    url = "http://localhost:8001/compile-resume"
    
    # Load test data
    if not TEST_DATA_PATH.exists():
        print(f"❌ Test data file not found: {TEST_DATA_PATH}")
        return False
    
    with open(TEST_DATA_PATH, "r") as f:
        resume_data = json.load(f)
    
    print("🧪 Testing LaTeX Compiler API...")
    print(f"📡 Sending request to: {url}")
    print(f"📄 Test data: {len(json.dumps(resume_data))} bytes")
    
    try:
        response = requests.post(
            url,
            json=resume_data,
            timeout=60  # LaTeX compilation can take time
        )
        
        if response.status_code == 200:
            # Save PDF
            output_path = Path(__file__).parent / "test_output.pdf"
            with open(output_path, "wb") as f:
                f.write(response.content)
            
            print(f"✅ PDF generated successfully!")
            print(f"📁 Saved to: {output_path}")
            print(f"📊 PDF size: {len(response.content)} bytes")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection refused. Is the FastAPI service running on port 8001?")
        print("   Start it with: python main.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_compile_resume()
    sys.exit(0 if success else 1)

