import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const History = () => {
  const navigate = useNavigate()
  const [reconciliations, setReconciliations] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadReconciliations()
  }, [])

  const loadReconciliations = () => {
    // TODO: Integrar com API para buscar do banco de dados
    // const data = await APIService.getReconciliations()
    
    // Por enquanto, buscar do localStorage
    const saved = JSON.parse(localStorage.getItem('reconciliations') || '[]')
    setReconciliations(saved.sort((a, b) => new Date(b.date) - new Date(a.date)))
  }

  const filteredReconciliations = reconciliations.filter(rec => {
    const matchesSearch = 
      rec.files.bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.files.internal.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || rec.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const handleView = (reconciliation) => {
    navigate('/reconciliation', {
      state: {
        files: {
          file1: { name: reconciliation.files.bank },
          file2: { name: reconciliation.files.internal }
        },
        reconciliationResult: {
          matched: reconciliation.matched,
          bank_only: reconciliation.bank_only,
          internal_only: reconciliation.internal_only,
          summary: reconciliation.summary
        }
      }
    })
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir esta conciliação?')) {
      const updated = reconciliations.filter(rec => rec.id !== id)
      localStorage.setItem('reconciliations', JSON.stringify(updated))
      setReconciliations(updated)
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Concluída'
      case 'pending':
        return 'Pendente'
      case 'error':
        return 'Erro'
      default:
        return status
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Histórico de Conciliações</h1>
            <p className="text-gray-600 mt-1">
              {reconciliations.length} conciliação{reconciliations.length !== 1 ? 'ões' : ''} salva{reconciliations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/import')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Nova Conciliação
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Buscar por nome de arquivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">Concluída</option>
              <option value="pending">Pendente</option>
              <option value="error">Erro</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredReconciliations.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conciliação encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando uma nova conciliação'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/import')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Nova Conciliação
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reconciliations List */}
        {filteredReconciliations.length > 0 && (
          <div className="space-y-4">
            {filteredReconciliations.map((rec) => (
              <div
                key={rec.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rec.files.bank} ⟷ {rec.files.internal}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rec.status)}`}>
                        {getStatusText(rec.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {rec.summary?.matched_count || 0}
                        </div>
                        <div className="text-xs text-green-700">Matches</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {rec.summary?.bank_only_count || 0}
                        </div>
                        <div className="text-xs text-yellow-700">Apenas Banco</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {rec.summary?.internal_only_count || 0}
                        </div>
                        <div className="text-xs text-blue-700">Apenas Sistema</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">
                          {Math.round((rec.summary?.match_rate || 0) * 100)}%
                        </div>
                        <div className="text-xs text-gray-700">Taxa Match</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      {formatDate(rec.date)}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleView(rec)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Ver Detalhes
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Message */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Informação</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  As conciliações são salvas localmente no navegador. Em uma versão futura, 
                  elas serão salvas no banco de dados e associadas à sua conta de usuário.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default History