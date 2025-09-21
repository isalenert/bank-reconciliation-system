import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ImportFiles = () => {
  const navigate = useNavigate()
  const [files, setFiles] = useState({
    file1: null,
    file2: null
  })

  const handleFileUpload = (file, type) => {
    setFiles(prev => ({ ...prev, [type]: file }))
  }

  const handleContinue = () => {
    if (files.file1 && files.file2) {
      navigate('/preprocess', { state: { files } })
    }
  }

  const getFileType = (fileName) => {
    if (!fileName) return ''
    return fileName.toLowerCase().endsWith('.pdf') ? 'PDF' : 'CSV'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Import Files</h1>
        <p className="text-green-700 mb-8">
          Upload the files you want to reconcile. You can use any combination of PDF and CSV files.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* File 1 */}
          <div className="border-2 border-dashed border-green-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">File 1 (PDF or CSV)</h3>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-8 mb-4">
              <p className="text-green-600 mb-4">Drag and drop your file here</p>
              <p className="text-green-500 mb-4">Supports: PDF, CSV</p>
              <p className="text-green-500">Or</p>
              <input
                type="file"
                accept=".pdf,.csv"
                onChange={(e) => handleFileUpload(e.target.files[0], 'file1')}
                className="hidden"
                id="file1-upload"
              />
              <label
                htmlFor="file1-upload"
                className="inline-block bg-green-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-600 mt-2 transition-colors"
              >
                Select File
              </label>
            </div>
            {files.file1 && (
              <div>
                <p className="text-sm text-green-600 font-medium">{files.file1.name}</p>
                <p className="text-xs text-green-500">Type: {getFileType(files.file1.name)}</p>
              </div>
            )}
          </div>

          {/* File 2 */}
          <div className="border-2 border-dashed border-green-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">File 2 (PDF or CSV)</h3>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-8 mb-4">
              <p className="text-green-600 mb-4">Drag and drop your file here</p>
              <p className="text-green-500 mb-4">Supports: PDF, CSV</p>
              <p className="text-green-500">Or</p>
              <input
                type="file"
                accept=".pdf,.csv"
                onChange={(e) => handleFileUpload(e.target.files[0], 'file2')}
                className="hidden"
                id="file2-upload"
              />
              <label
                htmlFor="file2-upload"
                className="inline-block bg-green-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-600 mt-2 transition-colors"
              >
                Select File
              </label>
            </div>
            {files.file2 && (
              <div>
                <p className="text-sm text-green-600 font-medium">{files.file2.name}</p>
                <p className="text-xs text-green-500">Type: {getFileType(files.file2.name)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">Supported Combinations:</h4>
          <ul className="text-sm text-green-700 list-disc list-inside">
            <li>PDF + PDF</li>
            <li>CSV + CSV</li>
            <li>PDF + CSV</li>
            <li>CSV + PDF</li>
          </ul>
        </div>

        <button
          onClick={handleContinue}
          disabled={!files.file1 || !files.file2}
          className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Mapping
        </button>
      </div>
    </div>
  )
}

export default ImportFiles