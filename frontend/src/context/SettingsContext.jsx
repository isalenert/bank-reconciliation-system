import React, { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}

const defaultSettings = {
  // Parâmetros de Conciliação
  dateTolerance: 1,
  valueTolerance: 0.01,
  similarityThreshold: 0.8,
  prioritizeExactMatches: true,
  autoSuggestManualMatches: true,
  
  // Formato de Dados
  dateFormat: 'DD/MM/YYYY',
  currencyFormat: 'BRL',
  decimalSeparator: ',',
  
  // Interface
  theme: 'light',
  primaryColor: 'green',
  compactView: false,
  showAdvancedStats: true,
  
  // Notificações
  notifyLowMatchRate: true,
  notifyLargeDiscrepancies: true,
  matchRateThreshold: 0.7,
  
  // Exportação
  exportFormat: 'csv',
  includeMetadata: true
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('reconciliationSettings')
      if (saved) {
        const parsedSettings = JSON.parse(saved)
        setSettings({ ...defaultSettings, ...parsedSettings })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      setSettings(defaultSettings)
    }
  }

  const updateSettings = (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings }
      setSettings(updatedSettings)
      localStorage.setItem('reconciliationSettings', JSON.stringify(updatedSettings))
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.setItem('reconciliationSettings', JSON.stringify(defaultSettings))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}