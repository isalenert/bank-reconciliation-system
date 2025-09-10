import pandas as pd
import chardet
from typing import Dict, List, Optional
from datetime import datetime

class CSVProcessor:
    def __init__(self):
        self.supported_encodings = ['utf-8', 'iso-8859-1', 'latin-1']
    
    def detect_encoding(self, file_path: str) -> str:
        """Detecta o encoding do arquivo"""
        with open(file_path, 'rb') as f:
            raw_data = f.read(10000)
            result = chardet.detect(raw_data)
            return result['encoding']
    
    def read_csv(self, file_path: str, encoding: Optional[str] = None) -> pd.DataFrame:
        """Lê arquivo CSV com suporte a múltiplos encodings"""
        if not encoding:
            encoding = self.detect_encoding(file_path)
            print(f"Encoding detectado: {encoding}")
        
        try:
            df = pd.read_csv(file_path, encoding=encoding)
            return df
        except UnicodeDecodeError:
            for enc in self.supported_encodings:
                if enc != encoding:
                    try:
                        df = pd.read_csv(file_path, encoding=enc)
                        print(f"Arquivo lido com encoding: {enc}")
                        return df
                    except UnicodeDecodeError:
                        continue
            raise ValueError("Não foi possível ler o arquivo com nenhum encoding suportado")
    
    def standardize_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Padroniza dados do DataFrame"""
        df_clean = df.copy()
        
        date_columns = [col for col in df.columns if 'data' in col.lower() or 'date' in col.lower()]
        for col in date_columns:
            # Converte para datetime e depois para string formatada (YYYY-MM-DD)
            df_clean[col] = pd.to_datetime(df_clean[col], errors='coerce').dt.strftime('%Y-%m-%d')
        
        numeric_columns = [col for col in df.columns if 'valor' in col.lower() or 'value' in col.lower() or 'amount' in col.lower()]
        for col in numeric_columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
        
        return df_clean

    def prepare_for_json(self, df: pd.DataFrame) -> list:
        """Prepara o DataFrame para serialização JSON"""
        # Garante que todas as datas estão como strings
        df_json = df.copy()
        for col in df_json.columns:
            # Se for datetime, converte para string
            if pd.api.types.is_datetime64_any_dtype(df_json[col]):
                df_json[col] = df_json[col].dt.strftime('%Y-%m-%d')
            # Se for Timestamp, também converte
            elif hasattr(df_json[col], 'dt'):
                df_json[col] = df_json[col].dt.strftime('%Y-%m-%d')
        
        return df_json.to_dict(orient='records')

if __name__ == "__main__":
    processor = CSVProcessor()
    print("CSV Processor criado com sucesso!")
