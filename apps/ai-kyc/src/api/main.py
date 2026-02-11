from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import os
import requests
import shutil
from datetime import datetime
from .kyc_processor import KYCProcessor

app = FastAPI(title="AI KYC Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class VerifyRequest(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    id_front_url: str
    selfie_url: str

def download_image(url: str, dest_path: str):
    try:
        response = requests.get(url, stream=True, timeout=10)
        response.raise_for_status()
        with open(dest_path, 'wb') as f:
            response.raw.decode_content = True
            shutil.copyfileobj(response.raw, f)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image from URL: {str(e)}")

@app.post("/api/kyc/verify")
async def verify_kyc(data: VerifyRequest) -> Dict:
    try:
        # Paths for temporary storage
        doc_filename = f"{data.user_id}_doc.jpg"
        selfie_filename = f"{data.user_id}_selfie.jpg"
        doc_path = os.path.join(UPLOAD_DIR, doc_filename)
        selfie_path = os.path.join(UPLOAD_DIR, selfie_filename)

        # Download images
        download_image(data.id_front_url, doc_path)
        download_image(data.selfie_url, selfie_path)

        processor = KYCProcessor()

        # 1. Verify Document Authenticity (Basic checks)
        is_doc_valid, doc_checks = processor.verify_document_authenticity(doc_path)
        # We don't hard fail here, just report it
        
        # 2. Face Matching
        is_match, score, match_details = processor.verify_face_match(doc_path, selfie_path)

        # 3. Document Data Extraction (OCR)
        try:
            ocr_data = processor.extract_document_data(doc_path)
        except Exception as e:
            ocr_data = {"error": str(e)}

        # Cleanup temp files
        try:
            os.remove(doc_path)
            os.remove(selfie_path)
        except:
            pass

        return {
            "status": "success" if is_match else "failed",
            "user_id": data.user_id,
            "face_verification": {
                "match": is_match,
                "confidence": score,
                "details": match_details
            },
            "document_verification": {
                "valid": is_doc_valid,
                "checks": doc_checks
            },
            "ocr_data": ocr_data
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"status": "ok", "service": "AI KYC Verifier"}