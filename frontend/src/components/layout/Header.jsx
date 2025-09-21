import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Header = () => {
  const location = useLocation()

  return (
    <header className="bg-white shadow-sm border-b border-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-green-800">
              LM Conciliation
            </Link>
          </div>
          <nav className="flex space-x-4">
            <Link 
              to="/" 
              className={`${
                location.pathname === '/' ? 'text-green-600 font-semibold' : 'text-gray-600'
              } hover:text-green-700 transition-colors`}
            >
              Home
            </Link>
            <Link 
              to="/import" 
              className={`${
                location.pathname === '/import' ? 'text-green-600 font-semibold' : 'text-gray-600'
              } hover:text-green-700 transition-colors`}
            >
              Importar
            </Link>
            <Link 
              to="/history" 
              className={`${
                location.pathname === '/history' ? 'text-green-600 font-semibold' : 'text-gray-600'
              } hover:text-green-700 transition-colors`}
            >
              Histórico
            </Link>
            <Link 
              to="/settings" 
              className={`${
                location.pathname === '/settings' ? 'text-green-600 font-semibold' : 'text-gray-600'
              } hover:text-green-700 transition-colors`}
            >
              Configurações
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header