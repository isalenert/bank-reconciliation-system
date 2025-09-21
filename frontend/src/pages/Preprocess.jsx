import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const Preprocess = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { files } = location.state || {}

  const [bankData, setBankData] = useState([])
  const [systemData, setSystemData] = useState([])
  const [bankMapping, setBankMapping] = useState({})
  const [systemMapping, setSystemMapping] = useState({})
  const [processing, setProcessing] = useState(false)
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
      
      // Processar arquivos localmente (sem backend)
      const bankPreview = await readFilePreview(file1)
      const systemPreview = await readFilePreview(file2)
      
      setBankData(bankPreview)
      setSystemData(systemPreview)
      
    } catch (error) {
      console.error('Erro ao processar arquivos:', error)
      setError('Erro ao processar arquivos: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const readFilePreview = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target.result
          const lines = content.split('\n').filter(line => line.trim() !== '')
          
          // Detectar delimitador (vírgula ou ponto-e-vírgula)
          const firstLine = lines[0]
          const hasSemicolon = firstLine.includes(';')
          const delimiter = hasSemicolon ? ';' : ','
          
          const data = lines.slice(0, 6).map(line => {
            const values = line.split(delimiter)
            return values.map(value => value.trim().replace(/^"|"$/g, ''))
          })
          
          resolve(data)
        } catch (parseError) {
          reject(parseError)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  const handleReconcile = () => {
    // Verificar mapeamentos mínimos
    const requiredFields = ['Date', 'Value', 'Description']
    const missingBankFields = requiredFields.filter(field => bankMapping[field] === undefined)
    const missingSystemFields = requiredFields.filter(field => systemMapping[field] === undefined)
    
    if (missingBankFields.length > 0) {
      setError(`Preencha os campos obrigatórios no Arquivo 1: ${missingBankFields.join(', ')}`)
      return
    }
    
    if (missingSystemFields.length > 0) {
      setError(`Preencha os campos obrigatórios no Arquivo 2: ${missingSystemFields.join(', ')}`)
      return
    }

    navigate('/reconciliation', {
      state: {
        files,
        bankData: bankData.slice(1), // Remover header
        systemData: systemData.slice(1), // Remover header
        columnMapping: {
          date_col: `Column ${bankMapping.Date + 1}`,
          value_col: `Column ${bankMapping.Value + 1}`,
          desc_col: `Column ${bankMapping.Description + 1}`,
          id_col: bankMapping['Optional Unique ID'] !== undefined ? 
                  `Column ${bankMapping['Optional Unique ID'] + 1}` : 
                  (systemMapping['Optional Unique ID'] !== undefined ? 
                   `Column ${systemMapping['Optional Unique ID'] + 1}` : ''),
          date_tolerance: 1,
          value_tolerance: 0.01,
          similarity_threshold: 0.8
        }
      }
    })
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
          <p className="text-gray-600 mt-4">Processando arquivos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pré-processamento e Mapeamento</h1>
        </div>

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
            
            {bankData.length > 0 ? (
              <div className="bg-gray-50 border border-green-200 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-100 grid grid-cols-6 text-sm font-medium text-gray-700">
                  <div className="p-3 border-r border-gray-200">Linha</div>
                  {bankData[0]?.map((_, index) => (
                    <div key={index} className="p-3 border-r border-gray-200">
                      Coluna {index + 1}
                    </div>
                  )).slice(0, 5)}
                </div>

                {/* Table Rows */}
                {bankData.map((row, index) => (
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

            {/* Mapping Section */}
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
                      {bankData[0]?.map((_, index) => (
                        <option key={index} value={index}>
                          Coluna {index + 1}
                        </option>
                      ))}
                    </select>
                    {bankMapping[field] !== undefined && bankData[0]?.[bankMapping[field]] && (
                      <p className="text-sm text-green-600 mt-1">
                        Exemplo: {bankData[0][bankMapping[field]]}
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
            
            {systemData.length > 0 ? (
              <div className="bg-gray-50 border border-green-200 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-100 grid grid-cols-6 text-sm font-medium text-gray-700">
                  <div className="p-3 border-r border-gray-200">Linha</div>
                  {systemData[0]?.map((_, index) => (
                    <div key={index} className="p-3 border-r border-gray-200">
                      Coluna {index + 1}
                    </div>
                  )).slice(0, 5)}
                </div>

                {/* Table Rows */}
                {systemData.map((row, index) => (
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

            {/* Mapping Section */}
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
                      {systemData[0]?.map((_, index) => (
                        <option key={index} value={index}>
                          Coluna {index + 1}
                        </option>
                      ))}
                    </select>
                    {systemMapping[field] !== undefined && systemData[0]?.[systemMapping[field]] && (
                      <p className="text-sm text-green-600 mt-1">
                        Exemplo: {systemData[0][systemMapping[field]]}
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
            className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
          >
            Voltar
          </button>
          
          <button
            onClick={handleReconcile}
            disabled={
              bankMapping.Date === undefined || 
              bankMapping.Value === undefined || 
              bankMapping.Description === undefined ||
              systemMapping.Date === undefined || 
              systemMapping.Value === undefined || 
              systemMapping.Description === undefined
            }
            className="px-8 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
          >
            Conciliação
          </button>
        </div>
      </div>
    </div>
  )
}

export default Preprocess