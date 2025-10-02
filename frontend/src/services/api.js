// services/api.js
const API_BASE_URL = 'http://localhost:8000'

class APIService {
  async uploadCSV(file) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/upload/csv`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao fazer upload do CSV:', error)
      throw new Error(`Erro ao fazer upload do CSV: ${error.message}`)
    }
  }

  async uploadPDF(file) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/upload/pdf`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao fazer upload do PDF:', error)
      throw new Error(`Erro ao fazer upload do PDF: ${error.message}`)
    }
  }

  async reconcileTransactions(bankFile, internalFile, config) {
    const formData = new FormData()
    formData.append('bank_file', bankFile)
    formData.append('internal_file', internalFile)
    
    // Adicionar configurações como campos do formulário
    formData.append('date_col', config.date_col || 'Data')
    formData.append('value_col', config.value_col || 'Valor')
    formData.append('desc_col', config.desc_col || 'Descricao')
    formData.append('id_col', config.id_col || '')
    formData.append('date_tolerance', config.date_tolerance || 1)
    formData.append('value_tolerance', config.value_tolerance || 0.01)
    formData.append('similarity_threshold', config.similarity_threshold || 0.8)

    try {
      const response = await fetch(`${API_BASE_URL}/reconcile`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro na conciliação:', error)
      throw new Error(`Erro na conciliação: ${error.message}`)
    }
  }

  // Método auxiliar para determinar se um arquivo é PDF ou CSV
  getFileType(fileName) {
    if (!fileName) return 'unknown'
    return fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'csv'
  }

  // Método para processar arquivo baseado no tipo
  async processFile(file) {
    const fileType = this.getFileType(file.name)
    
    if (fileType === 'csv') {
      return await this.uploadCSV(file)
    } else if (fileType === 'pdf') {
      return await this.uploadPDF(file)
    } else {
      throw new Error('Tipo de arquivo não suportado. Use apenas CSV ou PDF.')
    }
  }
}

export default new APIService()