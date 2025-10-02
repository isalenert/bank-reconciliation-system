import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useSettings } from './context/SettingsContext'
import Header from './components/layout/Header'
import Home from './pages/Home'
import ImportFiles from './pages/ImportFiles'
import Preprocess from './pages/Preprocess'
import Reconciliation from './pages/Reconciliation'
import ManualReconciliation from './pages/ManualReconciliation'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Settings from './pages/Settings'

function AppContent() {
  const { settings } = useSettings()

  useEffect(() => {
    // Aplicar tema (cor) ao documento
    document.documentElement.setAttribute('data-theme', settings.primaryColor)
  }, [settings.primaryColor])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/import" element={<ImportFiles />} />
            <Route path="/preprocess" element={<Preprocess />} />
            <Route path="/reconciliation" element={<Reconciliation />} />
            <Route path="/manual-reconciliation" element={<ManualReconciliation />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function App() {
  return <AppContent />
}

export default App