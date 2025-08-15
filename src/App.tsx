import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import StoresPage from './components/StoresPage'
import ProductsPage from './components/ProductsPage'
import OrdersPage from './components/OrdersPage'
import CustomersPage from './components/CustomersPage'
import SettingsPage from './components/SettingsPage'
import ReportsPage from './components/ReportsPage'
import AnalyticsPage from './components/AnalyticsPage'
import SupportPage from './components/SupportPage'
import DocsPage from './components/DocsPage'
import MarketingPage from './components/MarketingPage'
import ReviewsPage from './components/ReviewsPage'
import AuthPage from './components/AuthPage'
import MiniAppRoute from './components/MiniAppRoute'
import { auth } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [miniAppStoreId, setMiniAppStoreId] = useState<string | null>(null)

  useEffect(() => {
    // Проверяем, не является ли это мини-приложением
    const path = window.location.pathname
    const miniAppMatch = path.match(/^\/miniapp\/(.+)$/)
    
    if (miniAppMatch) {
      setMiniAppStoreId(miniAppMatch[1])
      setLoading(false)
      return
    }

    // Проверяем текущего пользователя при загрузке для обычного приложения
    checkUser()

    // Подписываемся на изменения аутентификации
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await auth.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderPage = () => {
    console.log('Рендерим страницу:', currentPage)
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'stores':
        return <StoresPage />
      case 'products':
        return <ProductsPage />
      case 'orders':
        return <OrdersPage />
      case 'customers':
        return <CustomersPage />
      case 'settings':
        console.log('Рендерим SettingsPage')
        return <SettingsPage />
      case 'reports':
        return <ReportsPage />
      case 'analytics':
        return <AnalyticsPage />
      case 'support':
        return <SupportPage />
      case 'docs':
        return <DocsPage />
      case 'marketing':
        return <MarketingPage />
      case 'reviews':
        return <ReviewsPage />
      default:
        console.log('Неизвестная страница, показываем Dashboard')
        return <Dashboard />
    }
  }

  // Если это мини-приложение, показываем его
  if (miniAppStoreId) {
    return <MiniAppRoute storeId={miniAppStoreId} />
  }

  // Показываем загрузку
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  // Если пользователь не авторизован, показываем страницу входа
  if (!user) {
    return <AuthPage />
  }

  // Если пользователь авторизован, показываем основное приложение
  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage} user={user}>
      {renderPage()}
    </Layout>
  )
}

export default App