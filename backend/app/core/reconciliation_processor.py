import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any
from datetime import datetime, timedelta
from fuzzywuzzy import fuzz
import Levenshtein
import json

class ReconciliationProcessor:
    def __init__(self, date_tolerance_days: int = 1, value_tolerance: float = 0.01, similarity_threshold: float = 0.8):
        self.date_tolerance_days = date_tolerance_days
        self.value_tolerance = value_tolerance
        self.similarity_threshold = similarity_threshold
    
    def _convert_timestamps(self, obj: Any) -> Any:
        """Converte objetos Timestamp para string para serialização JSON"""
        if isinstance(obj, pd.Timestamp):
            return obj.strftime('%Y-%m-%d')
        elif isinstance(obj, pd.Series):
            return obj.astype(str).tolist()
        elif isinstance(obj, dict):
            return {k: self._convert_timestamps(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_timestamps(item) for item in obj]
        return obj
    
    def _normalize_dataframes(self, df1: pd.DataFrame, df2: pd.DataFrame, 
                            date_col: str, value_col: str, desc_col: str, id_col: str = None) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Normaliza os DataFrames para comparação"""
        print(f"🔄 [DEBUG] Normalizando DataFrames...")
        
        df1_clean = df1.copy()
        df2_clean = df2.copy()
        
        # Garantir que colunas de data estão no formato correto
        for i, df in enumerate([df1_clean, df2_clean], 1):
            print(f"📅 [DEBUG] Processando DataFrame {i}")
            print(f"   Colunas: {list(df.columns)}")
            
            if date_col in df.columns:
                print(f"   Convertendo coluna de data: {date_col}")
                df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
                print(f"   Datas convertidas. Valores únicos: {df[date_col].nunique()}")
            
            if value_col in df.columns:
                print(f"   Convertendo coluna de valor: {value_col}")
                df[value_col] = pd.to_numeric(df[value_col], errors='coerce')
                print(f"   Valores convertidos. Range: {df[value_col].min()} to {df[value_col].max()}")
        
        return df1_clean, df2_clean
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calcula similaridade entre duas strings"""
        if pd.isna(text1) or pd.isna(text2):
            return 0.0
        return fuzz.ratio(str(text1).lower(), str(text2).lower()) / 100.0
    
    def _match_by_id(self, df1: pd.DataFrame, df2: pd.DataFrame, id_col: str) -> pd.DataFrame:
        """Pareamento por ID único"""
        if id_col not in df1.columns or id_col not in df2.columns:
            return pd.DataFrame()
        
        merged = pd.merge(df1, df2, on=id_col, suffixes=('_bank', '_internal'))
        return merged
    
    def _match_by_fuzzy_logic(self, df_bank: pd.DataFrame, df_internal: pd.DataFrame, 
                             date_col: str, value_col: str, desc_col: str) -> pd.DataFrame:
        """Pareamento por lógica fuzzy: data ± tolerância, valor ± tolerância, descrição similar"""
        matches = []
        
        for _, bank_row in df_bank.iterrows():
            bank_date = bank_row[date_col]
            bank_value = bank_row[value_col]
            bank_desc = bank_row[desc_col]
            
            # Encontrar correspondências no sistema interno
            potential_matches = df_internal[
                (abs((df_internal[date_col] - bank_date).dt.days) <= self.date_tolerance_days) &
                (abs(df_internal[value_col] - bank_value) <= self.value_tolerance)
            ]
            
            for _, internal_row in potential_matches.iterrows():
                similarity = self._calculate_similarity(bank_desc, internal_row[desc_col])
                if similarity >= self.similarity_threshold:
                    match = {
                        'bank_transaction': self._convert_timestamps(bank_row.to_dict()),
                        'internal_transaction': self._convert_timestamps(internal_row.to_dict()),
                        'similarity_score': similarity,
                        'match_type': 'fuzzy'
                    }
                    matches.append(match)
        
        return pd.DataFrame(matches)
    
    def reconcile(self, bank_df: pd.DataFrame, internal_df: pd.DataFrame, 
                 config: Dict) -> Dict:
        """Executa a conciliação entre extrato bancário e sistema interno"""
        print(f"🔍 [DEBUG] Iniciando reconciliação...")
        print(f"📊 [DEBUG] Bank DF shape: {bank_df.shape}")
        print(f"📊 [DEBUG] Internal DF shape: {internal_df.shape}")
        print(f"📋 [DEBUG] Bank columns: {list(bank_df.columns)}")
        print(f"📋 [DEBUG] Internal columns: {list(internal_df.columns)}")
        print(f"⚙️ [DEBUG] Config: {config}")
        
        # Extrair configurações
        date_col = config.get('date_col', 'Data')
        value_col = config.get('value_col', 'Valor')
        desc_col = config.get('desc_col', 'Descricao')
        id_col = config.get('id_col', None)
        
        print(f"📝 [DEBUG] Colunas identificadas: date={date_col}, value={value_col}, desc={desc_col}, id={id_col}")
        
        # Verificar se as colunas existem nos DataFrames
        required_cols = [date_col, value_col, desc_col]
        for col in required_cols:
            if col not in bank_df.columns:
                error_msg = f"Coluna '{col}' não encontrada no arquivo do banco. Colunas disponíveis: {list(bank_df.columns)}"
                print(f"❌ [ERROR] {error_msg}")
                raise ValueError(error_msg)
            
            if col not in internal_df.columns:
                error_msg = f"Coluna '{col}' não encontrada no arquivo interno. Colunas disponíveis: {list(internal_df.columns)}"
                print(f"❌ [ERROR] {error_msg}")
                raise ValueError(error_msg)
        
        print(f"✅ [DEBUG] Todas as colunas necessárias encontradas!")
        
        # Normalizar dados
        bank_df_norm, internal_df_norm = self._normalize_dataframes(
            bank_df, internal_df, date_col, value_col, desc_col, id_col
        )
        
        print(f"📊 [DEBUG] Bank DF normalizado shape: {bank_df_norm.shape}")
        print(f"📊 [DEBUG] Internal DF normalizado shape: {internal_df_norm.shape}")
        
        results = {
            'matched': [],
            'bank_only': [],
            'internal_only': [],
            'discrepancies': []
        }
        
        # Etapa 1: Pareamento por ID (se disponível)
        id_matches = pd.DataFrame()
        if id_col and id_col in bank_df_norm.columns and id_col in internal_df_norm.columns:
            id_matches = self._match_by_id(bank_df_norm, internal_df_norm, id_col)
        
        # Etapa 2: Pareamento fuzzy para transações restantes
        # Remover transações já pareadas por ID
        bank_remaining = bank_df_norm
        internal_remaining = internal_df_norm
        
        if not id_matches.empty:
            matched_ids = id_matches[id_col].unique()
            bank_remaining = bank_df_norm[~bank_df_norm[id_col].isin(matched_ids)]
            internal_remaining = internal_df_norm[~internal_df_norm[id_col].isin(matched_ids)]
        
        fuzzy_matches = self._match_by_fuzzy_logic(bank_remaining, internal_remaining, 
                                                  date_col, value_col, desc_col)
        
        # Combinar resultados
        all_matches = []
        if not id_matches.empty:
            for _, row in id_matches.iterrows():
                match = {
                    'bank_transaction': self._convert_timestamps(
                        {k: v for k, v in row.items() if k.endswith('_bank') or k == id_col}
                    ),
                    'internal_transaction': self._convert_timestamps(
                        {k: v for k, v in row.items() if k.endswith('_internal') or k == id_col}
                    ),
                    'similarity_score': 1.0,
                    'match_type': 'exact_id'
                }
                all_matches.append(match)
        
        all_matches.extend(fuzzy_matches.to_dict('records'))
        
        # Identificar transações não pareadas
        matched_bank_ids = set()
        matched_internal_ids = set()
        
        for match in all_matches:
            bank_trans = match['bank_transaction']
            internal_trans = match['internal_transaction']
            
            if 'index' in bank_trans:
                matched_bank_ids.add(bank_trans['index'])
            if 'index' in internal_trans:
                matched_internal_ids.add(internal_trans['index'])
        
        # Transações apenas no banco
        bank_only = bank_df_norm[~bank_df_norm.index.isin(matched_bank_ids)]
        # Transações apenas no sistema interno
        internal_only = internal_df_norm[~internal_df_norm.index.isin(matched_internal_ids)]
        
        # Preparar resultados (convertendo timestamps)
        results['matched'] = all_matches
        results['bank_only'] = self._convert_timestamps(bank_only.to_dict('records'))
        results['internal_only'] = self._convert_timestamps(internal_only.to_dict('records'))
        results['summary'] = {
            'total_bank_transactions': len(bank_df_norm),
            'total_internal_transactions': len(internal_df_norm),
            'matched_count': len(all_matches),
            'bank_only_count': len(bank_only),
            'internal_only_count': len(internal_only),
            'match_rate': len(all_matches) / max(len(bank_df_norm), len(internal_df_norm), 1)
        }
        
        print(f"✅ [DEBUG] Reconciliação concluída!")
        print(f"📈 [DEBUG] Resultados: {results['summary']}")
        
        return results

# Teste básico
if __name__ == "__main__":
    processor = ReconciliationProcessor()
    print("✅ ReconciliationProcessor criado com sucesso!")
