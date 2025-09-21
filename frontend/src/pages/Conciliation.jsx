import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import FileUpload from '../components/conciliation/FileUpload'

const Conciliation = () => {
  const location = useLocation()
  const [results, setResults] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Resto do código permanece igual...
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">Conciliação Financeira</h1>
            <p className="text-gray-600">Faça upload dos arquivos para iniciar a conciliação</p>
          </div>
        </div>

        <FileUpload 
          onProcessing={setIsProcessing}
          onResults={setResults}
        />
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Resultados</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default Conciliation