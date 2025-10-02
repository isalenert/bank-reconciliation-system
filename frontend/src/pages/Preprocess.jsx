import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import APIService from '../services/api'
import { useSettings } from '../context/SettingsContext' // ← NOVO

const Preprocess = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { files } = location.state || {}
  const { settings } = useSettings() // ← NOVO: Hook para acessar configurações

  const [file1Data, setFile1Data] = useState(null)
  const [file2Data, setFile2Data] = useState(null)
  const [file1Preview, setFile1Preview] = useState([])
  const [file2Preview, setFile2Preview] = useState([])
  const [bankMapping, setBankMapping] = useState({})
  const [systemMapping, setSystemMapping] = useState({})
  const [processing, setProcessing] = useState(false)
  const [reconciling, setReconciling] = useState(false) // ← NOVO
  const [error, setError] = useState(null)

  useEffect(() => {
    if (files && files.file1 && files.file2) {
      processFiles(files.file1, files.file2)
    } else {
      navigate('/import')
    }
  }, [files, navigate])

  const processFiles = async (file1, file2) => {
    try {
      setProcessing(true)
      setError(null)
      
      console.log('🔄 Enviando arquivos para o backend...')
      
      // Processar arquivos usando o backend
      const [file1Response, file2Response] = await Promise.all([
        APIService.processFile(file1),
        APIService.processFile(file2)
      ])

      console.log('✅ Respostas do backend:', { file1Response, file2Response })
      
      setFile1Data(file1Response)
      setFile2Data(file2Response)
      
      // Extrair preview dos dados para exibição
      setFile1Preview(extractPreviewData(file1Response))
      setFile2Preview(extractPreviewData(file2Response))
      
    } catch (error) {
      console.error('❌ Erro ao processar arquivos:', error)
      setError('Erro ao processar arquivos: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const extractPreviewData = (response) => {
    // Para CSV: usar os dados de preview
    if (response.preview) {
      const preview = response.preview.slice(0, 6)
      if (preview.length === 0) return []
      
      const columns = response.columns || Object.keys(preview[0])
      const headerRow = columns
      
      const dataRows = preview.map(row => 
        columns.map(col => row[col] || '')
      )
      
      return [headerRow, ...dataRows]
    }
    
    // Para PDF: usar os dados de preview
    if (response.preview_data) {
      const preview = response.preview_data.slice(0, 6)
      if (preview.length === 0) return []
      
      const columns = Object.keys(preview[0])
      const headerRow = columns
      
      const dataRows = preview.map(row => 
        columns.map(col => row[col] || '')
      )
      
      return [headerRow, ...dataRows]
    }
    
    return []
  }

  const handleReconcile = async () => {
    try {
      setReconciling(true) // ← NOVO
      setError(null)

      // Verificar mapeamentos mínimos
      const requiredFields = ['Date', 'Value', 'Description']
      const missingBankFields = requiredFields.filter(field => bankMapping[field] === undefined)
      const missingSystemFields = requiredFields.filter(field => systemMapping[field] === undefined)
      
      if (missingBankFields.length > 0) {
        throw new Error(`Preencha os campos obrigatórios no Arquivo 1: ${missingBankFields.join(', ')}`)
      }
      
      if (missingSystemFields.length > 0) {
        throw new Error(`Preencha os campos obrigatórios no Arquivo 2: ${missingSystemFields.join(', ')}`)
      }

      console.log('🔄 Iniciando conciliação...')
      
      // Mapear índices para nomes de colunas reais
      const file1Columns = file1Data.columns || Object.keys(file1Data.preview?.[0] || file1Data.preview_data?.[0] || {})
      const file2Columns = file2Data.columns || Object.keys(file2Data.preview?.[0] || file2Data.preview_data?.[0] || {})
      
      // ← ATUALIZADO: Usar configurações do Context
      const config = {
        date_col: file1Columns[bankMapping.Date],
        value_col: file1Columns[bankMapping.Value], 
        desc_col: file1Columns[bankMapping.Description],
        id_col: bankMapping['Optional Unique ID'] !== undefined ? 
                file1Columns[bankMapping['Optional Unique ID']] : '',
        date_tolerance: settings.dateTolerance,           // Das configurações
        value_tolerance: settings.valueTolerance,         // Das configurações
        similarity_threshold: settings.similarityThreshold // Das configurações
      }

      console.log('📝 Configuração da conciliação:', config)
      
      // Chamar API de conciliação
      const reconciliationResult = await APIService.reconcileTransactions(
        files.file1,
        files.file2,
        config
      )

      console.log('✅ Resultado da conciliação:', reconciliationResult)

      // Navegar para página de resultados
      navigate('/reconciliation', {
        state: {
          files,
          file1Data,
          file2Data,
          reconciliationResult,
          columnMapping: config,
          bankMapping,
          systemMapping
        }
      })
      
    } catch (error) {
      console.error('❌ Erro na conciliação:', error)
      setError(error.message)
    } finally {
      setReconciling(false) // ← NOVO
    }
  }

  const updateBankMapping = (field, value) => {
    setBankMapping(prev => ({
      ...prev,
      [field]: value === '' ? undefined : parseInt(value)
    }))
  }

  const updateSystemMapping = (field, value) => {
    setSystemMapping(prev => ({
      ...prev,
      [field]: value === '' ? undefined : parseInt(value)
    }))
  }

  if (!files || !files.file1 || !files.file2) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">Carregando arquivos...</p>
        </div>
      </div>
    )
  }

  if (processing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
          <p className="text-gray-600 mt-4">Processando arquivos no backend...</p>
          <p className="text-sm text-gray-500 mt-2">Aguarde enquanto analisamos seus dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
        {/* Header */}
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pré-processamento e Mapeamento</h1>
        </div>

        {/* Success Info */}
        {file1Data && file2Data && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800">✅ Arquivo 1 Processado</h3>
              <p className="text-sm text-green-700">
                {file1Data.filename} - {file1Data.row_count || file1Data.transactions_count || 0} linhas
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800">✅ Arquivo 2 Processado</h3>
              <p className="text-sm text-green-700">
                {file2Data.filename} - {file2Data.row_count || file2Data.transactions_count || 0} linhas
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File 1: Bank Statement */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Arquivo 1: Extrato Bancário</h2>
            <p className="text-sm text-gray-600 mb-4">({files.file1.name})</p>
            
            {file1Preview.length > 0 ? (
              <div className="bg-gray-50 border border-green-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 grid grid-cols-6 text-sm font-medium text-gray-700">
                  <div className="p-3 border-r border-gray-200">Linha</div>
                  {file1Preview[0]?.map((_, index) => (
                    <div key={index} className="p-3 border-r border-gray-200">
                      Coluna {index + 1}
                    </div>
                  )).slice(0, 5)}
                </div>

                {file1Preview.map((row, index) => (
                  <div key={index} className="grid grid-cols-6 text-sm border-t border-gray-200">
                    <div className="p-3 border-r border-gray-200 text-gray-600 bg-gray-50">{index + 1}</div>
                    {row.map((cell, cellIndex) => (
                      <div key={cellIndex} className="p-3 border-r border-gray-200 text-green-700 truncate">
                        {cell || ''}
                      </div>
                    )).slice(0, 5)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">Nenhum dado para exibir</p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Mapear Colunas</h3>
              
              <div className="space-y-4">
                {['Date', 'Value', 'Description', 'Optional Unique ID'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field === 'Optional Unique ID' ? 'ID Único (Opcional)' : field}
                    </label>
                    <select
                      className="w-full p-3 border border-green-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={bankMapping[field] !== undefined ? bankMapping[field] : ''}
                      onChange={(e) => updateBankMapping(field, e.target.value)}
                    >
                      <option value="">Selecionar</option>
                      {file1Preview[0]?.map((_, index) => (
                        <option key={index} value={index}>
                          Coluna {index + 1}
                        </option>
                      ))}
                    </select>
                    {bankMapping[field] !== undefined && file1Preview[0]?.[bankMapping[field]] && (
                      <p className="text-sm text-green-600 mt-1">
                        Exemplo: {file1Preview[0][bankMapping[field]]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* File 2: Transaction Data */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Arquivo 2: Sistema Interno</h2>
            <p className="text-sm text-gray-600 mb-4">({files.file2.name})</p>
            
            {file2Preview.length > 0 ? (
              <div className="bg-gray-50 border border-green-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 grid grid-cols-6 text-sm font-medium text-gray-700">
                  <div className="p-3 border-r border-gray-200">Linha</div>
                  {file2Preview[0]?.map((_, index) => (
                    <div key={index} className="p-3 border-r border-gray-200">
                      Coluna {index + 1}
                    </div>
                  )).slice(0, 5)}
                </div>

                {file2Preview.map((row, index) => (
                  <div key={index} className="grid grid-cols-6 text-sm border-t border-gray-200">
                    <div className="p-3 border-r border-gray-200 text-gray-600 bg-gray-50">{index + 1}</div>
                    {row.map((cell, cellIndex) => (
                      <div key={cellIndex} className="p-3 border-r border-gray-200 text-green-700 truncate">
                        {cell || ''}
                      </div>
                    )).slice(0, 5)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">Nenhum dado para exibir</p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Mapear Colunas</h3>
              
              <div className="space-y-4">
                {['Date', 'Value', 'Description', 'Optional Unique ID'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field === 'Optional Unique ID' ? 'ID Único (Opcional)' : field}
                    </label>
                    <select
                      className="w-full p-3 border border-green-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={systemMapping[field] !== undefined ? systemMapping[field] : ''}
                      onChange={(e) => updateSystemMapping(field, e.target.value)}
                    >
                      <option value="">Selecionar</option>
                      {file2Preview[0]?.map((_, index) => (
                        <option key={index} value={index}>
                          Coluna {index + 1}
                        </option>
                      ))}
                    </select>
                    {systemMapping[field] !== undefined && file2Preview[0]?.[systemMapping[field]] && (
                      <p className="text-sm text-green-600 mt-1">
                        Exemplo: {file2Preview[0][systemMapping[field]]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/import')}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Voltar
          </button>
          
          <button
            onClick={handleReconcile}
            disabled={
              reconciling ||
              bankMapping.Date === undefined || 
              bankMapping.Value === undefined || 
              bankMapping.Description === undefined ||
              systemMapping.Date === undefined || 
              systemMapping.Value === undefined || 
              systemMapping.Description === undefined
            }
            className="px-8 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg transition-colors flex items-center"
          >
            {reconciling ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              'Iniciar Conciliação'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Preprocess