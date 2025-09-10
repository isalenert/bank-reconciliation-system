from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import tempfile
import os
from app.core.csv_processor import CSVProcessor
from app.core.pdf_processor import PDFProcessor

app = FastAPI(
    title="Sistema de Conciliação Bancária",
    description="API para conciliação de extratos bancários em CSV e PDF",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Sistema de Conciliação Bancária API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    """Endpoint para upload de arquivos CSV"""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        processor = CSVProcessor()
        df = processor.read_csv(tmp_path)
        df_clean = processor.standardize_data(df)
        
        os.unlink(tmp_path)
        
        return JSONResponse({
            "filename": file.filename,
            "columns": df_clean.columns.tolist(),
            "row_count": len(df_clean),
            "preview": df_clean.head(5).to_dict(orient="records")
        })
        
    except Exception as e:
        return JSONResponse(
            {"error": f"Erro ao processar arquivo: {str(e)}"},
            status_code=500
        )

@app.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Endpoint para upload de arquivos PDF"""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        processor = PDFProcessor()
        text = processor.extract_text_from_pdf(tmp_path)
        df = processor.parse_bank_statement(text)
        
        os.unlink(tmp_path)
        
        return JSONResponse({
            "filename": file.filename,
            "text_length": len(text),
            "transactions_count": len(df),
            "preview_text": text[:200] + "..." if len(text) > 200 else text,
            "preview_data": df.head().to_dict(orient="records") if not df.empty else []
        })
        
    except Exception as e:
        return JSONResponse(
            {"error": f"Erro ao processar PDF: {str(e)}"},
            status_code=500
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
