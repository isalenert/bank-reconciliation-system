import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const ManualReconciliation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { bank_only, internal_only, reconciliationResult, files } = location.state || {}

  const [bankTransactions, setBankTransactions] = useState([])
  const [internalTransactions, setInternalTransactions] = useState([])
  const [selectedBank, setSelectedBank] = useState(null)
  const [selectedInternal, setSelectedInternal] = useState(null)
  const [manualMatches, setManualMatches] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(true)

  useEffect(() => {
    if (!bank_only || !internal_only) {
      navigate('/import')
      return
    }
    
    setBankTransactions(bank_only)
    setInternalTransactions(internal_only)
    generateSuggestions(bank_only, internal_only)
  }, [bank_only, internal_only, navigate])

  const generateSuggestions = (bankData, internalData) => {
    const suggestionsList = []
    const dateToleranceDays = 3
    const valueTolerancePercent = 0.02

    bankData.forEach((bankTx, bankIdx) => {
      const bankDate = new Date(bankTx.Data || bankTx.date || bankTx['Data Bank'] || Object.values(bankTx)[0])
      const bankValue = parseFloat(bankTx.Valor || bankTx.value || bankTx['Valor Bank'] || Object.values(bankTx)[1])
      const bankDesc = String(bankTx.Descricao || bankTx.description || bankTx['Descricao Bank'] || Object.values(bankTx)[2] || '').toLowerCase()

      internalData.forEach((internalTx, internalIdx) => {
        const internalDate = new Date(internalTx.Data || internalTx.date || internalTx['Data Internal'] || Object.values(internalTx)[0])
        const internalValue = parseFloat(internalTx.Valor || internalTx.value || internalTx['Valor Internal'] || Object.values(internalTx)[1])
        const internalDesc = String(internalTx.Descricao || internalTx.description || internalTx['Descricao Internal'] || Object.values(internalTx)[2] || '').toLowerCase()

        const dateDiff = Math.abs((bankDate - internalDate) / (1000 * 60 * 60 * 24))
        const valueDiff = Math.abs((bankValue - internalValue) / bankValue)
        const descSimilarity = calculateSimilarity(bankDesc, internalDesc)

        if (dateDiff <= dateToleranceDays && valueDiff <= valueTolerancePercent) {
          const confidence = calculateConfidence(dateDiff, valueDiff, descSimilarity)
          
          suggestionsList.push({
            bankIndex: bankIdx,
            internalIndex: internalIdx,
            bankTransaction: bankTx,
            internalTransaction: internalTx,
            confidence,
            reasons: {
              dateDiff: Math.round(dateDiff),
              valueDiff: Math.round(valueDiff * 100),
              descSimilarity: Math.round(descSimilarity * 100)
            }
          })
        }
      })
    })

    suggestionsList.sort((a, b) => b.confidence - a.confidence)
    setSuggestions(suggestionsList.slice(0, 10))
  }

  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  const levenshteinDistance = (str1, str2) => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  const calculateConfidence = (dateDiff, valueDiff, descSimilarity) => {
    const dateScore = Math.max(0, (3 - dateDiff) / 3) * 0.3
    const valueScore = Math.max(0, (0.02 - valueDiff) / 0.02) * 0.4
    const descScore = descSimilarity * 0.3
    
    return (dateScore + valueScore + descScore) * 100
  }

  const handleSelectBank = (transaction, index) => {
    setSelectedBank({ transaction, index })
    setSelectedInternal(null)
  }

  const handleSelectInternal = (transaction, index) => {
    setSelectedInternal({ transaction, index })
  }

  const handleCreateMatch = () => {
    if (!selectedBank || !selectedInternal) return

    const newMatch = {
      bank_transaction: selectedBank.transaction,
      internal_transaction: selectedInternal.transaction,
      match_type: 'manual',
      similarity_score: 1.0
    }

    setManualMatches([...manualMatches, newMatch])
    
    setBankTransactions(bankTransactions.filter((_, i) => i !== selectedBank.index))
    setInternalTransactions(internalTransactions.filter((_, i) => i !== selectedInternal.index))
    
    setSelectedBank(null)
    setSelectedInternal(null)
    
    generateSuggestions(
      bankTransactions.filter((_, i) => i !== selectedBank.index),
      internalTransactions.filter((_, i) => i !== selectedInternal.index)
    )
  }

  const handleAcceptSuggestion = (suggestion) => {
    const newMatch = {
      bank_transaction: suggestion.bankTransaction,
      internal_transaction: suggestion.internalTransaction,
      match_type: 'suggested',
      similarity_score: suggestion.confidence / 100
    }

    setManualMatches([...manualMatches, newMatch])
    
    setBankTransactions(bankTransactions.filter((_, i) => i !== suggestion.bankIndex))
    setInternalTransactions(internalTransactions.filter((_, i) => i !== suggestion.internalIndex))
    
    setSuggestions(suggestions.filter(s => s !== suggestion))
    
    generateSuggestions(
      bankTransactions.filter((_, i) => i !== suggestion.bankIndex),
      internalTransactions.filter((_, i) => i !== suggestion.internalIndex)
    )
  }

  const handleSaveMatches = () => {
    const updatedResults = {
      ...reconciliationResult,
      matched: [...(reconciliationResult?.matched || []), ...manualMatches],
      bank_only: bankTransactions,
      internal_only: internalTransactions,
      summary: {
        ...reconciliationResult.summary,
        matched_count: (reconciliationResult?.summary?.matched_count || 0) + manualMatches.length,
        bank_only_count: bankTransactions.length,
        internal_only_count: internalTransactions.length
      }
    }

    navigate('/reconciliation', {
      state: {
        files,
        reconciliationResult: updatedResults
      }
    })
  }

  const formatValue = (value) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return value
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800'
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-orange-100 text-orange-800'
  }

  const TransactionCard = ({ transaction, isSelected, onSelect, type }) => {
    const keys = Object.keys(transaction)
    const dateKey = keys.find(k => k.toLowerCase().includes('data') || k.toLowerCase().includes('date'))
    const valueKey = keys.find(k => k.toLowerCase().includes('valor') || k.toLowerCase().includes('value'))
    const descKey = keys.find(k => k.toLowerCase().includes('desc'))

    return (
      <div
        onClick={onSelect}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'border-green-500 bg-green-50'
            : 'border-gray-200 hover:border-green-300 hover:shadow-md'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium text-gray-500">{type}</span>
          {isSelected && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">Selecionado</span>
          )}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Data:</span>
            <span className="font-medium">{formatDate(transaction[dateKey])}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Valor:</span>
            <span className="font-medium">{formatValue(transaction[valueKey])}</span>
          </div>
          <div className="text-gray-700 mt-2">
            <span className="text-xs text-gray-500">Descrição:</span>
            <p className="text-xs mt-1">{transaction[descKey]}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!bank_only || !internal_only) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reconciliação Manual</h1>
            <p className="text-green-600 mt-1">
              {manualMatches.length} matches criados | {bankTransactions.length} banco | {internalTransactions.length} sistema
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/reconciliation', { state: { files, reconciliationResult } })}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveMatches}
              disabled={manualMatches.length === 0}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Salvar {manualMatches.length} Matches
            </button>
          </div>
        </div>

        {/* Sugestões */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-900">
                Sugestões Inteligentes ({suggestions.length})
              </h2>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showSuggestions ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            <div className="space-y-3">
              {suggestions.slice(0, 3).map((suggestion, idx) => (
                <div key={idx} className="bg-white border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                      {Math.round(suggestion.confidence)}% confiança
                    </span>
                    <button
                      onClick={() => handleAcceptSuggestion(suggestion)}
                      className="px-4 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Aceitar Match
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <TransactionCard
                      transaction={suggestion.bankTransaction}
                      isSelected={false}
                      onSelect={() => {}}
                      type="Banco"
                    />
                    <TransactionCard
                      transaction={suggestion.internalTransaction}
                      isSelected={false}
                      onSelect={() => {}}
                      type="Sistema"
                    />
                  </div>
                  
                  <div className="mt-3 flex gap-4 text-xs text-gray-600">
                    <span>Diferença de data: {suggestion.reasons.dateDiff} dias</span>
                    <span>Diferença de valor: {suggestion.reasons.valueDiff}%</span>
                    <span>Similaridade: {suggestion.reasons.descSimilarity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seleção Manual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Transações do Banco ({bankTransactions.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {bankTransactions.map((tx, idx) => (
                <TransactionCard
                  key={idx}
                  transaction={tx}
                  isSelected={selectedBank?.index === idx}
                  onSelect={() => handleSelectBank(tx, idx)}
                  type="Banco"
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Transações do Sistema ({internalTransactions.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {internalTransactions.map((tx, idx) => (
                <TransactionCard
                  key={idx}
                  transaction={tx}
                  isSelected={selectedInternal?.index === idx}
                  onSelect={() => handleSelectInternal(tx, idx)}
                  type="Sistema"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Botão de Match */}
        {(selectedBank || selectedInternal) && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 border-2 border-green-500">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">
                  {selectedBank ? '1 banco' : '0 banco'} + {selectedInternal ? '1 sistema' : '0 sistema'}
                </span>
              </div>
              <button
                onClick={handleCreateMatch}
                disabled={!selectedBank || !selectedInternal}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                Criar Match
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManualReconciliation