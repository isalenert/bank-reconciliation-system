import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const Reconciliation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { reconciliationResult, files, columnMapping } = location.state || {}

  const [activeTab, setActiveTab] = useState('matches')
  const [searchTerm, setSearchTerm] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!reconciliationResult) {
      navigate('/import')
    }
  }, [reconciliationResult, navigate])

  if (!reconciliationResult) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">Carregando resultados...</p>
        </div>
      </div>
    )
  }

  const { matched, bank_only, internal_only, summary } = reconciliationResult

  const formatValue = (value) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }
    return value
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  const getMatchTypeColor = (type) => {
    switch (type) {
      case 'exact_id':
        return 'bg-green-100 text-green-800'
      case 'fuzzy':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchTypeName = (type) => {
    switch (type) {
      case 'exact_id':
        return 'ID Exato'
      case 'fuzzy':
        return 'Similaridade'
      default:
        return 'Outro'
    }
  }

  const filteredData = (data) => {
    if (!searchTerm) return data
    
    return data.filter(item => {
      const searchString = JSON.stringify(item).toLowerCase()
      return searchString.includes(searchTerm.toLowerCase())
    })
  }

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveReconciliation = async () => {
    // Preparar dados para salvar
    const reconciliationData = {
      id: Date.now(), // ID temporário, será substituído pelo banco
      date: new Date().toISOString(),
      files: {
        bank: files?.file1?.name || 'banco.csv',
        internal: files?.file2?.name || 'sistema.csv'
      },
      summary: summary,
      matched: matched,
      bank_only: bank_only,
      internal_only: internal_only,
      status: 'completed'
    }

    try {
      // TODO: Integrar com API para salvar no banco de dados
      // await APIService.saveReconciliation(reconciliationData)
      
      // Por enquanto, salvar no localStorage como exemplo
      const savedReconciliations = JSON.parse(localStorage.getItem('reconciliations') || '[]')
      savedReconciliations.push(reconciliationData)
      localStorage.setItem('reconciliations', JSON.stringify(savedReconciliations))
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      
      console.log('✅ Conciliação salva:', reconciliationData)
    } catch (error) {
      console.error('❌ Erro ao salvar conciliação:', error)
      alert('Erro ao salvar conciliação. Tente novamente.')
    }
  }

  const MatchesTab = () => (
    <div className="space-y-4">
      {filteredData(matched).map((match, index) => (
        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-800">Match #{index + 1}</h3>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(match.match_type)}`}>
                {getMatchTypeName(match.match_type)}
              </span>
              {match.similarity_score && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                  {Math.round(match.similarity_score * 100)}% similar
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Transaction */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3">🏦 Extrato Bancário</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(match.bank_transaction || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-medium">
                      {key.toLowerCase().includes('valor') || key.toLowerCase().includes('value') 
                        ? formatValue(value) 
                        : key.toLowerCase().includes('data') || key.toLowerCase().includes('date')
                        ? formatDate(value)
                        : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Transaction */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3">💼 Sistema Interno</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(match.internal_transaction || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-medium">
                      {key.toLowerCase().includes('valor') || key.toLowerCase().includes('value') 
                        ? formatValue(value) 
                        : key.toLowerCase().includes('data') || key.toLowerCase().includes('date')
                        ? formatDate(value)
                        : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {filteredData(matched).length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm ? 'Nenhum match encontrado com os critérios de busca' : 'Nenhum match encontrado'}
          </p>
        </div>
      )}
    </div>
  )

  const BankOnlyTab = () => (
    <div className="space-y-4">
      {filteredData(bank_only).map((transaction, index) => (
        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-yellow-800">🏦 Transação Bancária #{index + 1}</h3>
            <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              Apenas no Banco
            </span>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(transaction || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-medium">
                    {key.toLowerCase().includes('valor') || key.toLowerCase().includes('value') 
                      ? formatValue(value) 
                      : key.toLowerCase().includes('data') || key.toLowerCase().includes('date')
                      ? formatDate(value)
                      : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      
      {filteredData(bank_only).length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm ? 'Nenhuma transação encontrada com os critérios de busca' : 'Nenhuma transação exclusiva do banco encontrada'}
          </p>
        </div>
      )}
    </div>
  )

  const InternalOnlyTab = () => (
    <div className="space-y-4">
      {filteredData(internal_only).map((transaction, index) => (
        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-800">💼 Transação Interna #{index + 1}</h3>
            <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              Apenas no Sistema
            </span>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(transaction || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-medium">
                    {key.toLowerCase().includes('valor') || key.toLowerCase().includes('value') 
                      ? formatValue(value) 
                      : key.toLowerCase().includes('data') || key.toLowerCase().includes('date')
                      ? formatDate(value)
                      : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      
      {filteredData(internal_only).length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm ? 'Nenhuma transação encontrada com os critérios de busca' : 'Nenhuma transação exclusiva do sistema interno encontrada'}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resultados da Conciliação</h1>
            <p className="text-green-600 mt-1">
              Análise concluída para {files?.file1?.name} e {files?.file2?.name}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard', { state: { files, reconciliationResult } })}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Visualizar Dashboard
            </button>
            <button
              onClick={() => navigate('/import')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Nova Conciliação
            </button>
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800 font-medium">Conciliação salva com sucesso!</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{summary?.matched_count || 0}</div>
            <div className="text-sm text-green-700 mt-1">Matches Encontrados</div>
            <div className="text-xs text-green-600 mt-2">
              {Math.round((summary?.match_rate || 0) * 100)}% taxa de match
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{summary?.bank_only_count || 0}</div>
            <div className="text-sm text-yellow-700 mt-1">Apenas no Banco</div>
            <div className="text-xs text-yellow-600 mt-2">Não encontradas no sistema</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{summary?.internal_only_count || 0}</div>
            <div className="text-sm text-blue-700 mt-1">Apenas no Sistema</div>
            <div className="text-xs text-blue-600 mt-2">Não encontradas no banco</div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-600">
              {(summary?.total_bank_transactions || 0) + (summary?.total_internal_transactions || 0)}
            </div>
            <div className="text-sm text-gray-700 mt-1">Total de Transações</div>
            <div className="text-xs text-gray-600 mt-2">
              {summary?.total_bank_transactions || 0} banco + {summary?.total_internal_transactions || 0} sistema
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            {(summary?.bank_only_count > 0 || summary?.internal_only_count > 0) && (
              <button
                onClick={() => navigate('/manual-reconciliation', {
                  state: {
                    bank_only,
                    internal_only,
                    reconciliationResult,
                    files
                  }
                })}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                Reconciliação Manual
              </button>
            )}
            <button
              onClick={handleSaveReconciliation}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salvar Conciliação
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('matches')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'matches'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Matches ({matched?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('bank_only')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bank_only'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Apenas no Banco ({bank_only?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('internal_only')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'internal_only'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Apenas no Sistema ({internal_only?.length || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'matches' && <MatchesTab />}
          {activeTab === 'bank_only' && <BankOnlyTab />}
          {activeTab === 'internal_only' && <InternalOnlyTab />}
        </div>

        {/* Configuration Info */}
        {columnMapping && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações da Conciliação</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Coluna Data:</span>
                  <span className="ml-2 text-gray-600">{columnMapping.date_col}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Coluna Valor:</span>
                  <span className="ml-2 text-gray-600">{columnMapping.value_col}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Coluna Descrição:</span>
                  <span className="ml-2 text-gray-600">{columnMapping.desc_col}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tolerância Data:</span>
                  <span className="ml-2 text-gray-600">{columnMapping.date_tolerance} dias</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tolerância Valor:</span>
                  <span className="ml-2 text-gray-600">{columnMapping.value_tolerance}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Similaridade:</span>
                  <span className="ml-2 text-gray-600">{Math.round((columnMapping.similarity_threshold || 0) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reconciliation