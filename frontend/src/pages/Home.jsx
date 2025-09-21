import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">LM Conciliation</h1>
          <p className="text-xl text-green-700">Bem vindo ao LM Concilitation!</p>
        </div>
        
        <Link
          to="/import"
          className="bg-green-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors shadow-md"
        >
          Iniciar
        </Link>
      </div>
    </div>
  )
}

export default Home