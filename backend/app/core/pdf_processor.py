import PyPDF2
import pandas as pd
import re
from typing import List, Dict, Optional
from datetime import datetime

class PDFProcessor:
    def __init__(self):
        self.common_patterns = {
            'date': r'\d{2}/\d{2}/\d{4}',
            'value': r'R\$\s?\d{1,3}(?:\.\d{3})*,\d{2}',
            'transaction': r'(PIX|TED|DOC|TEF|BOLETO|DEPÓSITO|TRANSF|PAGAMENTO)'
        }
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extrai texto de PDFs de extratos bancários"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                print(f"PDF possui {len(reader.pages)} páginas")
                
                for page_num, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    text += page_text + "\n"
                    print(f"Página {page_num + 1} extraída: {len(page_text)} caracteres")
                    
        except Exception as e:
            raise ValueError(f"Erro ao ler PDF: {str(e)}")
        
        return text

    def _parse_date(self, date_str: str) -> Optional[str]:
        """Converte datas para formato YYYY-MM-DD"""
        try:
            date_obj = datetime.strptime(date_str, '%d/%m/%Y')
            return date_obj.strftime('%Y-%m-%d')
        except ValueError:
            return None

    def _parse_value(self, value_str: str) -> Optional[float]:
        """Converte valores monetários para float"""
        try:
            clean_value = value_str.replace('R$', '').replace(' ', '').replace('.', '').replace(',', '.')
            return float(clean_value)
        except ValueError:
            return None

    def parse_bank_statement(self, text: str) -> pd.DataFrame:
        """Converte texto extraído em DataFrame estruturado"""
        lines = text.split('\n')
        transactions = []
        current_date = None
        
        for line in lines:
            line = line.strip()
            
            date_match = re.search(self.common_patterns['date'], line)
            if date_match:
                current_date = self._parse_date(date_match.group())
            
            value_match = re.search(self.common_patterns['value'], line)
            if value_match and current_date:
                value = self._parse_value(value_match.group())
                
                description = re.sub(self.common_patterns['date'], '', line)
                description = re.sub(self.common_patterns['value'], '', description)
                description = description.strip()
                
                if value is not None and description:
                    transactions.append({
                        'Data': current_date,
                        'Descrição': description,
                        'Valor': value,
                        'Tipo': 'Crédito' if value >= 0 else 'Débito'
                    })
        
        df = pd.DataFrame(transactions)
        
        if not df.empty:
            print(f"Encontradas {len(df)} transações no PDF")
        else:
            print("Nenhuma transação encontrada no PDF")
        
        return df

if __name__ == "__main__":
    processor = PDFProcessor()
    print("PDFProcessor criado com sucesso!")
