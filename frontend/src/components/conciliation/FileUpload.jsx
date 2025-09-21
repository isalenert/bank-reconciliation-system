import React, { useState } from 'react'

const FileUpload = ({ onProcessing, onResults }) => {
  const [bankFile, setBankFile] = useState(null)
  const [internalFile, setInternalFile] = useState(null)

  const handleBankFileSelect = (e) => {
    setBankFile(e.target.files[0])
  }

  const handleInternalFileSelect = (e) => {
    setInternalFile(e.target.files[0])
  }

  const handleProcess = async () => {
    if (!bankFile || !internalFile) {
      alert('Selecione ambos os arquivos: banco e sistema interno')
      return
    }

    onProcessing(true)
    
    // Simulação de processamento
    setTimeout(() => {
      onResults({
        matched: 45,
        unmatched: 8,
        total: 53,
        discrepancies: 3,
        summary: {
          matchRate: 85,
          totalAmount: 125000,
          discrepancyAmount: 2500
        }
      })
      onProcessing(false)
    }, 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Arquivo do Banco:
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleBankFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Arquivo do Sistema Interno:
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleInternalFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleProcess}
        disabled={!bankFile || !internalFile}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Iniciar Conciliação
      </button>
    </div>
  )
}

export default FileUpload
