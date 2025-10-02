import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { reconciliationResult, files } = location.state || {}

  const [insights, setInsights] = useState([])
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    if (!reconciliationResult) {
      navigate('/import')
      return
    }
    
    generateInsights()
    generateRecommendations()
  }, [reconciliationResult, navigate])

  const generateInsights = () => {
    const { matched, bank_only, internal_only, summary } = reconciliationResult
    const insightsList = []

    // Taxa de match
    const matchRate = summary?.match_rate || 0
    if (matchRate >= 0.9) {
      insightsList.push({
        type: 'success',
        title: 'Excelente taxa de conciliação',
        message: `${Math.round(matchRate * 100)}% das transações foram conciliadas automaticamente.`
      })
    } else if (matchRate >= 0.7) {
      insightsList.push({
        type: 'warning',
        title: 'Taxa de conciliação moderada',
        message: `${Math.round(matchRate * 100)}% conciliado. Considere revisar as configurações de tolerância.`
      })
    } else {
      insightsList.push({
        type: 'error',
        title: 'Taxa de conciliação baixa',
        message: `Apenas ${Math.round(matchRate * 100)}% conciliado. Verifique os mapeamentos de colunas e formatos de dados.`
      })
    }

    // Discrepâncias
    if (bank_only.length > internal_only.length) {
      insightsList.push({
        type: 'warning',
        title: 'Mais transações no banco',
        message: `${bank_only.length} transações aparecem apenas no extrato bancário.`
      })
    } else if (internal_only.length > bank_only.length) {
      insightsList.push({
        type: 'warning',
        title: 'Mais transações no sistema',
        message: `${internal_only.length} transações aparecem apenas no sistema interno.`
      })
    }

    // Análise de valores
    const totalBankValue = calculateTotalValue(bank_only)
    const totalInternalValue = calculateTotalValue(internal_only)
    
    if (Math.abs(totalBankValue - totalInternalValue) > 0.01) {
      insightsList.push({
        type: 'error',
        title: 'Diferença de valores',
        message: `Diferença de ${formatCurrency(Math.abs(totalBankValue - totalInternalValue))} entre banco e sistema.`
      })
    }

    setInsights(insightsList)
  }

  const generateRecommendations = () => {
    const { matched, bank_only, internal_only, summary } = reconciliationResult
    const recommendationsList = []

    if (bank_only.length > 0 || internal_only.length > 0) {
      recommendationsList.push({
        title: 'Realizar conciliação manual',
        description: 'Use a ferramenta de conciliação manual para vincular transações não correspondidas.',
        action: () => navigate('/manual-reconciliation', {
          state: { bank_only, internal_only, reconciliationResult, files }
        })
      })
    }

    if (summary?.match_rate < 0.8) {
      recommendationsList.push({
        title: 'Ajustar configurações de tolerância',
        description: 'Aumentar a tolerância de data e valor pode melhorar a taxa de match.',
        action: () => navigate('/settings')
      })
    }

    if (bank_only.length > 5) {
      recommendationsList.push({
        title: 'Verificar importação do sistema interno',
        description: 'Muitas transações faltando no sistema podem indicar problema na importação.',
        action: null
      })
    }

    setRecommendations(recommendationsList)
  }

  const calculateTotalValue = (transactions) => {
    return transactions.reduce((sum, tx) => {
      const keys = Object.keys(tx)
      const valueKey = keys.find(k => k.toLowerCase().includes('valor') || k.toLowerCase().includes('value'))
      const value = parseFloat(tx[valueKey]) || 0
      return sum + value
    }, 0)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getMatchDistribution = () => {
    const { matched, bank_only, internal_only } = reconciliationResult
    
    const exactMatches = matched?.filter(m => m.match_type === 'exact_id').length || 0
    const fuzzyMatches = matched?.filter(m => m.match_type === 'fuzzy').length || 0
    
    return { exactMatches, fuzzyMatches, unmatched: bank_only.length + internal_only.length }
  }

  const getValueDistribution = () => {
    const { matched, bank_only, internal_only } = reconciliationResult
    
    const matchedValue = calculateTotalValue(matched?.map(m => m.bank_transaction) || [])
    const bankOnlyValue = calculateTotalValue(bank_only)
    const internalOnlyValue = calculateTotalValue(internal_only)
    
    return { matchedValue, bankOnlyValue, internalOnlyValue }
  }

  const getDateRangeAnalysis = () => {
    const { matched, bank_only, internal_only } = reconciliationResult
    const allTransactions = [
      ...(matched?.map(m => m.bank_transaction) || []),
      ...bank_only,
      ...internal_only
    ]

    const dates = allTransactions.map(tx => {
      const keys = Object.keys(tx)
      const dateKey = keys.find(k => k.toLowerCase().includes('data') || k.toLowerCase().includes('date'))
      return new Date(tx[dateKey])
    }).filter(d => !isNaN(d))

    if (dates.length === 0) return { start: null, end: null, days: 0 }

    const start = new Date(Math.min(...dates))
    const end = new Date(Math.max(...dates))
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    return { start, end, days }
  }

  if (!reconciliationResult) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  const { matched, bank_only, internal_only, summary } = reconciliationResult
  const distribution = getMatchDistribution()
  const valueDistribution = getValueDistribution()
  const dateRange = getDateRangeAnalysis()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h1>
            <p className="text-gray-600 mt-1">
              Análise detalhada da conciliação entre {files?.file1?.name} e {files?.file2?.name}
            </p>
          </div>
          <button
            onClick={() => navigate('/reconciliation', { state: { files, reconciliationResult } })}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Ver Resultados
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Taxa de Match</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round((summary?.match_rate || 0) * 100)}%
                </p>
              </div>
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Total de Matches</p>
                <p className="text-3xl font-bold text-blue-600">{summary?.matched_count || 0}</p>
              </div>
              <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 mb-1">Discrepâncias</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {(summary?.bank_only_count || 0) + (summary?.internal_only_count || 0)}
                </p>
              </div>
              <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 mb-1">Período</p>
                <p className="text-3xl font-bold text-purple-600">{dateRange.days}</p>
                <p className="text-xs text-purple-600">dias</p>
              </div>
              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Distribution Chart */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Transações</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Matches por ID</span>
                  <span className="text-sm font-medium">{distribution.exactMatches}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${(distribution.exactMatches / (summary?.total_bank_transactions || 1)) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Matches por Similaridade</span>
                  <span className="text-sm font-medium">{distribution.fuzzyMatches}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${(distribution.fuzzyMatches / (summary?.total_bank_transactions || 1)) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Não Conciliadas</span>
                  <span className="text-sm font-medium">{distribution.unmatched}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-yellow-500 h-3 rounded-full transition-all"
                    style={{ width: `${(distribution.unmatched / (summary?.total_bank_transactions || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Value Distribution */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Valores</h3>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Valores Conciliados</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(valueDistribution.matchedValue)}
                  </span>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-700">Apenas no Banco</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {formatCurrency(valueDistribution.bankOnlyValue)}
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Apenas no Sistema</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(valueDistribution.internalOnlyValue)}
                  </span>
                </div>
              </div>

              {Math.abs(valueDistribution.bankOnlyValue - valueDistribution.internalOnlyValue) > 0.01 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-700 font-medium">Diferença Total</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(Math.abs(valueDistribution.bankOnlyValue - valueDistribution.internalOnlyValue))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights da Análise</h3>
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'success' ? 'bg-green-50 border-green-200' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {insight.type === 'success' && (
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {insight.type === 'warning' && (
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {insight.type === 'error' && (
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className={`text-sm font-medium ${
                        insight.type === 'success' ? 'text-green-800' :
                        insight.type === 'warning' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        {insight.title}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        insight.type === 'success' ? 'text-green-700' :
                        insight.type === 'warning' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unmatched Transactions Comparison */}
        {(bank_only.length > 0 || internal_only.length > 0) && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Transações Não Conciliadas - Comparação Visual
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bank Only */}
              <div className="border border-yellow-200 rounded-lg bg-yellow-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-yellow-800 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Apenas no Banco ({bank_only.length})
                  </h4>
                  <span className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(calculateTotalValue(bank_only))}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bank_only.slice(0, 10).map((tx, idx) => {
                    const keys = Object.keys(tx)
                    const dateKey = keys.find(k => k.toLowerCase().includes('data') || k.toLowerCase().includes('date'))
                    const valueKey = keys.find(k => k.toLowerCase().includes('valor') || k.toLowerCase().includes('value'))
                    const descKey = keys.find(k => k.toLowerCase().includes('desc'))
                    
                    return (
                      <div key={idx} className="bg-white border border-yellow-300 rounded p-3 text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900 text-xs bg-yellow-100 px-2 py-1 rounded">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-yellow-700">
                            {formatCurrency(tx[valueKey])}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          {new Date(tx[dateKey]).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-700 truncate">
                          {tx[descKey]}
                        </div>
                      </div>
                    )
                  })}
                  {bank_only.length > 10 && (
                    <div className="text-center py-2 text-sm text-yellow-700">
                      + {bank_only.length - 10} transações adicionais
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Only */}
              <div className="border border-blue-200 rounded-lg bg-blue-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Apenas no Sistema ({internal_only.length})
                  </h4>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(calculateTotalValue(internal_only))}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {internal_only.slice(0, 10).map((tx, idx) => {
                    const keys = Object.keys(tx)
                    const dateKey = keys.find(k => k.toLowerCase().includes('data') || k.toLowerCase().includes('date'))
                    const valueKey = keys.find(k => k.toLowerCase().includes('valor') || k.toLowerCase().includes('value'))
                    const descKey = keys.find(k => k.toLowerCase().includes('desc'))
                    
                    return (
                      <div key={idx} className="bg-white border border-blue-300 rounded p-3 text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900 text-xs bg-blue-100 px-2 py-1 rounded">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-blue-700">
                            {formatCurrency(tx[valueKey])}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          {new Date(tx[dateKey]).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-700 truncate">
                          {tx[descKey]}
                        </div>
                      </div>
                    )
                  })}
                  {internal_only.length > 10 && (
                    <div className="text-center py-2 text-sm text-blue-700">
                      + {internal_only.length - 10} transações adicionais
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">Análise das Discrepâncias</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Diferença de Quantidade:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {Math.abs(bank_only.length - internal_only.length)} transações
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Diferença de Valor:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {formatCurrency(Math.abs(calculateTotalValue(bank_only) - calculateTotalValue(internal_only)))}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Maior Discrepância:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {bank_only.length > internal_only.length ? 'Banco' : 'Sistema'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendações</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                  {rec.action && (
                    <button
                      onClick={rec.action}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Executar ação →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard