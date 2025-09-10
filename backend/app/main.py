from fastapi import FastAPI, File, UploadFile, Form  # ← Form adicionado
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import tempfile
import os
from app.core.csv_processor import CSVProcessor
from app.core.pdf_processor import PDFProcessor
from app.core.reconciliation_processor import ReconciliationProcessor  # ← Nova importação

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
        
        # Prepara os dados para JSON (converte datas para string)
        preview_data = df_clean.head(5).copy()
        for col in preview_data.columns:
            # Se for datetime ou timestamp, converte para string
            if str(preview_data[col].dtype).startswith('datetime'):
                preview_data[col] = preview_data[col].dt.strftime('%Y-%m-%d')
        
        return JSONResponse({
            "filename": file.filename,
            "columns": df_clean.columns.tolist(),
            "row_count": len(df_clean),
            "preview": preview_data.to_dict(orient="records")
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

@app.post("/reconcile")
async def reconcile_transactions(
    bank_file: UploadFile = File(...),
    internal_file: UploadFile = File(...),
    date_col: str = Form("Data"),
    value_col: str = Form("Valor"),
    desc_col: str = Form("Descricao"),
    id_col: str = Form(None),
    date_tolerance: int = Form(1),
    value_tolerance: float = Form(0.01),
    similarity_threshold: float = Form(0.8)
):
    """Endpoint para conciliação de transações"""
    try:
        print(f"🔍 Iniciando conciliação...")
        print(f"📋 Config: date_col={date_col}, value_col={value_col}, desc_col={desc_col}, id_col={id_col}")
        
        # Processar arquivo do banco
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp_bank:
            content = await bank_file.read()
            tmp_bank.write(content)
            tmp_bank_path = tmp_bank.name
        
        bank_processor = CSVProcessor()
        bank_df = bank_processor.read_csv(tmp_bank_path)
        print(f"📊 Banco: {len(bank_df)} transações")
        bank_df_clean = bank_processor.standardize_data(bank_df)
        print(f"✅ Banco processado: {len(bank_df_clean)} transações")
        
        # Processar arquivo interno
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp_internal:
            content = await internal_file.read()
            tmp_internal.write(content)
            tmp_internal_path = tmp_internal.name
        
        internal_processor = CSVProcessor()
        internal_df = internal_processor.read_csv(tmp_internal_path)
        print(f"📊 Sistema: {len(internal_df)} transações")
        internal_df_clean = internal_processor.standardize_data(internal_df)
        print(f"✅ Sistema processado: {len(internal_df_clean)} transações")
        
        # Limpar arquivos temporários
        os.unlink(tmp_bank_path)
        os.unlink(tmp_internal_path)
        
        # Verificar se os DataFrames não estão vazios
        if bank_df_clean.empty:
            raise ValueError("DataFrame do banco está vazio após processamento")
        if internal_df_clean.empty:
            raise ValueError("DataFrame do sistema interno está vazio após processamento")
        
        # Configurar processador de conciliação
        processor = ReconciliationProcessor(
            date_tolerance_days=date_tolerance,
            value_tolerance=value_tolerance,
            similarity_threshold=similarity_threshold
        )
        
        config = {
            'date_col': date_col,
            'value_col': value_col,
            'desc_col': desc_col,
            'id_col': id_col if id_col else None
        }
        
        print(f"🔧 Executando algoritmo de conciliação...")
        # Executar conciliação
        results = processor.reconcile(bank_df_clean, internal_df_clean, config)
        
        print(f"🎯 Conciliação concluída: {results['summary']['matched_count']} matches")
        return JSONResponse(results)
        
    except Exception as e:
        print(f"❌ ERRO na conciliação: {str(e)}")
        import traceback
        traceback.print_exc()  # Isso mostrará o traceback completo no terminal
        
        return JSONResponse(
            {"error": f"Erro na conciliação: {str(e)}"},
            status_code=500
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
