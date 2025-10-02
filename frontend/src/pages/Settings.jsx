import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'

const Settings = () => {
  const navigate = useNavigate()
  const { settings, updateSettings, resetSettings } = useSettings()
  const [localSettings, setLocalSettings] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('algorithm')

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = () => {
    updateSettings(localSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      resetSettings()
    }
  }

  const updateLocalSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const getMatchRateImpact = () => {
    const { dateTolerance, valueTolerance, similarityThreshold } = localSettings
    
    if (dateTolerance >= 3 && valueTolerance >= 0.05 && similarityThreshold <= 0.6) {
      return { level: 'high', text: 'Muito permissivo - pode gerar falsos positivos' }
    } else if (dateTolerance <= 1 && valueTolerance <= 0.01 && similarityThreshold >= 0.9) {
      return { level: 'low', text: 'Muito restritivo - pode perder matches válidos' }
    } else {
      return { level: 'medium', text: 'Balanceado - recomendado para maioria dos casos' }
    }
  }

  const AlgorithmSettings = () => {
    const impact = getMatchRateImpact()
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Como funciona o algoritmo</h4>
          <p className="text-sm text-blue-700">
            O algoritmo compara transações baseado em três critérios principais: proximidade de datas, 
            similaridade de valores e semelhança de descrições. Ajuste os parâmetros abaixo para 
            controlar o quão "flexível" ou "rigoroso" será o matching.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tolerância de Data: ±{localSettings.dateTolerance} dia(s)
          </label>
          <input
            type="range"
            min="0"
            max="7"
            value={localSettings.dateTolerance}
            onChange={(e) => updateLocalSetting('dateTolerance', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 dias (exato)</span>
            <span>7 dias (flexível)</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Permite matches entre transações com datas diferentes. Útil para compensações que demoram dias.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tolerância de Valor: ±{(localSettings.valueTolerance * 100).toFixed(2)}%
          </label>
          <input
            type="range"
            min="0"
            max="0.1"
            step="0.005"
            value={localSettings.valueTolerance}
            onChange={(e) => updateLocalSetting('valueTolerance', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0% (exato)</span>
            <span>10% (flexível)</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Permite pequenas diferenças de valores. Útil para considerar taxas ou arredondamentos.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Similaridade de Descrição: {Math.round(localSettings.similarityThreshold * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={localSettings.similarityThreshold}
            onChange={(e) => updateLocalSetting('similarityThreshold', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>50% (flexível)</span>
            <span>100% (exato)</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Define quão parecidas as descrições devem ser. Menor = mais matches, maior = mais preciso.
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          impact.level === 'high' ? 'bg-orange-50 border-orange-200' :
          impact.level === 'low' ? 'bg-yellow-50 border-yellow-200' :
          'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-start">
            <svg className={`h-5 w-5 ${
              impact.level === 'high' ? 'text-orange-400' :
              impact.level === 'low' ? 'text-yellow-400' :
              'text-green-400'
            }`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${
                impact.level === 'high' ? 'text-orange-800' :
                impact.level === 'low' ? 'text-yellow-800' :
                'text-green-800'
              }`}>
                Impacto na Taxa de Match
              </h4>
              <p className={`text-sm mt-1 ${
                impact.level === 'high' ? 'text-orange-700' :
                impact.level === 'low' ? 'text-yellow-700' :
                'text-green-700'
              }`}>
                {impact.text}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.prioritizeExactMatches}
              onChange={(e) => updateLocalSetting('prioritizeExactMatches', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Priorizar matches exatos por ID
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.autoSuggestManualMatches}
              onChange={(e) => updateLocalSetting('autoSuggestManualMatches', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Sugerir automaticamente matches manuais
            </span>
          </label>
        </div>
      </div>
    )
  }

  const InterfaceSettings = () => {
    const colorClasses = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500'
    }

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tema</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateLocalSetting('theme', 'light')}
              className={`p-4 border-2 rounded-lg ${
                localSettings.theme === 'light' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white border border-gray-300 rounded"></div>
                <span className="text-sm font-medium">Claro</span>
              </div>
            </button>
            <button
              onClick={() => updateLocalSetting('theme', 'dark')}
              className={`p-4 border-2 rounded-lg ${
                localSettings.theme === 'dark' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-800 border border-gray-600 rounded"></div>
                <span className="text-sm font-medium">Escuro</span>
              </div>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Tema escuro será implementado em versão futura</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Cor Principal</label>
          <div className="grid grid-cols-4 gap-3">
            {['green', 'blue', 'purple', 'indigo'].map(color => (
              <button
                key={color}
                onClick={() => updateLocalSetting('primaryColor', color)}
                className={`p-3 border-2 rounded-lg ${
                  localSettings.primaryColor === color ? 'border-gray-900' : 'border-gray-200'
                }`}
              >
                <div className={`w-full h-8 ${colorClasses[color]} rounded`}></div>
                <span className="text-xs capitalize mt-1 block">{color}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Visualização compacta</span>
            <input
              type="checkbox"
              checked={localSettings.compactView}
              onChange={(e) => updateLocalSetting('compactView', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Mostrar estatísticas avançadas</span>
            <input
              type="checkbox"
              checked={localSettings.showAdvancedStats}
              onChange={(e) => updateLocalSetting('showAdvancedStats', e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
          </label>
        </div>
      </div>
    )
  }

  const DataFormatSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Data</label>
        <select
          value={localSettings.dateFormat}
          onChange={(e) => updateLocalSetting('dateFormat', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2023)</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2023)</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD (2023-12-31)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Moeda</label>
        <select
          value={localSettings.currencyFormat}
          onChange={(e) => updateLocalSetting('currencyFormat', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="BRL">BRL - Real (R$ 1.234,56)</option>
          <option value="USD">USD - Dólar ($1,234.56)</option>
          <option value="EUR">EUR - Euro (€1.234,56)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Separador Decimal</label>
        <select
          value={localSettings.decimalSeparator}
          onChange={(e) => updateLocalSetting('decimalSeparator', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value=",">Vírgula (1.234,56)</option>
          <option value=".">Ponto (1,234.56)</option>
        </select>
      </div>
    </div>
  )

  const NotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          Configurações de notificações serão aplicadas em conciliações futuras.
        </p>
      </div>

      <label className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">Notificar taxa de match baixa</span>
          <p className="text-xs text-gray-500">Alerta quando a taxa de match for menor que o limite</p>
        </div>
        <input
          type="checkbox"
          checked={localSettings.notifyLowMatchRate}
          onChange={(e) => updateLocalSetting('notifyLowMatchRate', e.target.checked)}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
        />
      </label>

      {localSettings.notifyLowMatchRate && (
        <div className="ml-6">
          <label className="block text-sm text-gray-700 mb-2">
            Limite da taxa de match: {Math.round(localSettings.matchRateThreshold * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={localSettings.matchRateThreshold}
            onChange={(e) => updateLocalSetting('matchRateThreshold', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg"
          />
        </div>
      )}

      <label className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">Notificar grandes discrepâncias</span>
          <p className="text-xs text-gray-500">Alerta quando houver diferenças significativas de valores</p>
        </div>
        <input
          type="checkbox"
          checked={localSettings.notifyLargeDiscrepancies}
          onChange={(e) => updateLocalSetting('notifyLargeDiscrepancies', e.target.checked)}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
        />
      </label>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600 mt-1">Personalize o comportamento do sistema de conciliação</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Voltar
          </button>
        </div>

        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800 font-medium">Configurações salvas com sucesso!</p>
            </div>
          </div>
        )}

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'algorithm', name: 'Algoritmo' },
              { id: 'interface', name: 'Interface' },
              { id: 'data', name: 'Formato de Dados' },
              { id: 'notifications', name: 'Notificações' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-h-96">
          {activeTab === 'algorithm' && <AlgorithmSettings />}
          {activeTab === 'interface' && <InterfaceSettings />}
          {activeTab === 'data' && <DataFormatSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
          >
            Restaurar Padrão
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings