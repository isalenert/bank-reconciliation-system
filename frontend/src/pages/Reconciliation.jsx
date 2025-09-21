import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Reconciliation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // DEBUG: Log dos dados recebidos
  console.log('📍 Dados recebidos na reconciliação:', location.state);

  const { bankData, systemData, columnMapping, files } = location.state || {};
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar se os dados essenciais existem
    if (!bankData || !systemData || !columnMapping) {
      console.error('❌ Dados faltando:', {
        hasBankData: !!bankData,
        hasSystemData: !!systemData,
        hasColumnMapping: !!columnMapping
      });
      setError('Dados incompletos para conciliação. Volte e tente novamente.');
      setLoading(false);
      return;
    }

    console.log('✅ Dados recebidos - iniciando simulação');
    simulateReconciliation();
  }, [bankData, systemData, columnMapping]);

  const simulateReconciliation = () => {
    setLoading(true);
    setError(null);
    
    // Simular processamento
    setTimeout(() => {
      try {
        console.log('🎯 Simulando conciliação com:', {
          bankRows: bankData.length,
          systemRows: systemData.length,
          mapping: columnMapping
        });

        // Dados de exemplo baseados nos dados reais
        const mockResults = {
          matched: bankData.slice(0, 3).map((row, index) => ({
            bank_transaction: Object.fromEntries(
              row.map((value, i) => [`Column ${i + 1}`, value])
            ),
            internal_transaction: Object.fromEntries(
              systemData[index]?.map((value, i) => [`Column ${i + 1}`, value]) || []
            ),
            similarity_score: 0.7 + (index * 0.1),
            match_type: index === 0 ? 'exact_id' : 'fuzzy'
          })),
          bank_only: bankData.slice(3, 5).map(row => 
            Object.fromEntries(row.map((value, i) => [`Column ${i + 1}`, value]))
          ),
          internal_only: systemData.slice(3, 5).map(row => 
            Object.fromEntries(row.map((value, i) => [`Column ${i + 1}`, value]))
          ),
          summary: {
            total_bank_transactions: bankData.length,
            total_internal_transactions: systemData.length,
            matched_count: Math.min(3, bankData.length),
            bank_only_count: Math.max(0, bankData.length - 3),
            internal_only_count: Math.max(0, systemData.length - 3),
            match_rate: Math.min(3, bankData.length) / Math.max(bankData.length, systemData.length, 1)
          }
        };

        setResults(mockResults);
        console.log('✅ Simulação concluída:', mockResults.summary);
      } catch (err) {
        console.error('❌ Erro na simulação:', err);
        setError('Erro durante a conciliação: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  if (!bankData || !systemData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Dados Não Encontrados</h2>
          <p className="text-gray-600 mb-4">
            {error || 'Os arquivos necessários não foram encontrados. Por favor, volte e faça o upload novamente.'}
          </p>
          <button
            onClick={() => navigate('/import')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Voltar para Importação
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processando Conciliação</h2>
          <p className="text-gray-600">Analisando {bankData.length + systemData.length} transações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro na Conciliação</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/preprocess')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Voltar para Pré-processamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Resultados da Conciliação</h1>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              Exportar CSV
            </button>
            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        {results?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{results.summary.total_bank_transactions}</div>
              <div className="text-sm text-blue-800">Transações Banco</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{results.summary.total_internal_transactions}</div>
              <div className="text-sm text-green-800">Transações Sistema</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{results.summary.matched_count}</div>
              <div className="text-sm text-purple-800">Conciliadas</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {results.summary.bank_only_count + results.summary.internal_only_count}
              </div>
              <div className="text-sm text-orange-800">Divergências</div>
            </div>
          </div>
        )}

        {/* Resultados */}
        {results && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Transações Conciliadas ({results.matched.length})</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.matched, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Apenas no Banco ({results.bank_only.length})</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.bank_only, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Apenas no Sistema ({results.internal_only.length})</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(results.internal_only, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/preprocess')}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Voltar
          </button>
          
          <button
            onClick={() => navigate('/import')}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Nova Conciliação
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;