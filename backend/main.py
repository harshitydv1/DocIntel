from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from typing import Optional
from dotenv import load_dotenv

from core.rag import process_document, chat_with_rag, delete_document

load_dotenv()

app = FastAPI(title="DocIntel RAG API")

# Add CORS middleware to allow React frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

class ChatRequest(BaseModel):
    query: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "DocIntel RAG API is running"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")
    
    file_path = f"uploads/{file.filename}"
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the document and index it into Pinecone
        num_chunks = process_document(file_path)
        
        return {"status": "success", "message": f"Successfully processed {file.filename} into {num_chunks} chunks."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Optional: clean up the uploaded file after processing
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/chat")
async def chat(request: ChatRequest):
    if not request.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        response = chat_with_rag(request.query)
        return {"status": "success", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete")
async def delete_doc(filename: str):
    if not filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty")
    try:
        # source metadata is set to f"uploads/{filename}" during upload
        file_path = f"uploads/{filename}"
        delete_document(file_path)
        return {"status": "success", "message": f"Successfully deleted {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
