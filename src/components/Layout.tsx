import React, { useState } from 'react'
import { 
  Store, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Users,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Home,
  Zap,
  ChevronRight,
  HelpCircle,
  FileText,
  CreditCard,
  TrendingUp,
  Percent,
  Calendar,
  Folder,
  Target,
  Warehouse,
  Truck,
  DollarSign,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { auth, User as UserType } from '@/lib/supabase'

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
  user: UserType
}

const navigation = [
  { 
    name: 'Обзор', 
    icon: BarChart3, 
    id: 'dashboard',
    description: 'Общая статистика и аналитика'
  },
  { 
    name: 'Магазины', 
    icon: Store, 
    id: 'stores',
    description: 'Управление Telegram магазинами'
  },
  { 
    name: 'Товары', 
    icon: Package, 
    id: 'products',
    description: 'Каталог товаров из Wildberries'
  },
  { 
    name: 'Заказы', 
    icon: ShoppingCart, 
    id: 'orders',
    description: 'Заказы клиентов'
  },
  { 
    name: 'Клиенты', 
    icon: Users, 
    id: 'customers',
    description: 'База данных клиентов'
  },
  { 
    name: 'Настройки', 
    icon: Settings, 
    id: 'settings',
    description: 'Настройки платформы'
  }
]

const financesSection = [
  { 
    name: 'Отчеты', 
    icon: FileText, 
    id: 'reports',
    description: 'Отчеты по продажам'
  },
  { 
    name: 'Аналитика', 
    icon: BarChart3, 
    id: 'analytics',
    description: 'Детальная аналитика'
  }
]

const infoSection = [
  { 
    name: 'Поддержка', 
    icon: HelpCircle, 
    id: 'support',
    description: 'Техническая поддержка'
  },
  { 
    name: 'Документация', 
    icon: FileText, 
    id: 'docs',
    description: 'Инструкции и руководства'
  }
]


function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  )
}

export default function Layout({ children, currentPage, onPageChange, user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await auth.signOut()
  }

  const currentPageInfo = navigation.find(item => item.id === currentPage) || 
                         financesSection.find(item => item.id === currentPage) ||
                         infoSection.find(item => item.id === currentPage)

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar для мобильных */}
      <div className={cn(
        "fixed inset-0 flex z-40 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-purple-700 shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-gray-300 hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <SidebarContent 
            currentPage={currentPage} 
            onPageChange={onPageChange} 
            user={user} 
            onSignOut={handleSignOut}
            onItemClick={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Статичный sidebar для десктопа */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col bg-purple-700 text-white">
            <SidebarContent 
              currentPage={currentPage} 
              onPageChange={onPageChange} 
              user={user} 
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Хедер */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Главная</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900 font-medium">
                  {currentPageInfo?.name || 'Аналитика'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Поиск */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Поиск..."
                    className="pl-10 w-64 h-8 text-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Уведомления */}
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 h-8 w-8">
                <Bell className="h-4 w-4" />
              </Button>

              {/* Профиль пользователя */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 hover:bg-gray-100 px-2 py-1 h-8"
                >
                  <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-medium">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 hidden sm:block">
                    {user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </Button>

                {/* Выпадающее меню пользователя */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Выход
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Контент страницы */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay для закрытия меню пользователя */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  )
}

function SidebarContent({ 
  currentPage, 
  onPageChange, 
  user, 
  onSignOut,
  onItemClick
}: { 
  currentPage: string
  onPageChange: (page: string) => void
  user: UserType
  onSignOut: () => void
  onItemClick?: () => void
}) {
  return (
    <>
      {/* Логотип */}
      <div className="flex items-center h-12 px-3 border-b border-purple-600">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
            <Store className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-white font-bold text-base">
            TeleShop
          </div>
        </div>
      </div>
      
      {/* Навигация */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {/* Основные разделы */}
        <div className="mb-4">
          <div className="text-xs font-medium text-purple-200 uppercase tracking-wider mb-2 px-2">
            Основное
          </div>
          {navigation.map((item) => {
            const isActive = currentPage === item.id
            const isSettings = item.id === 'settings'
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-auto py-2 px-2 text-white hover:bg-purple-600 hover:text-white rounded-md mb-1",
                  isActive && "bg-purple-600 shadow-lg",
                  isSettings && "border-2 border-yellow-400" // Временная рамка для настроек
                )}
                onClick={() => {
                  console.log('Клик по кнопке:', item.name, 'id:', item.id)
                  onPageChange(item.id)
                  onItemClick?.()
                }}
                onMouseDown={() => {
                  console.log('MouseDown по кнопке:', item.name, 'id:', item.id)
                }}
                onMouseUp={() => {
                  console.log('MouseUp по кнопке:', item.name, 'id:', item.id)
                }}
              >
                <div className="flex items-center space-x-2 w-full">
                  <div className={cn(
                    "p-1 rounded-md",
                    isActive ? "bg-white/20" : "bg-white/10"
                  )}>
                    <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  </div>
                  <span className="text-xs flex-1">{item.name}</span>
                </div>
              </Button>
            )
          })}
        </div>

        {/* Финансы и документы */}
        <div className="mb-4">
          <div className="text-xs font-medium text-purple-200 uppercase tracking-wider mb-2 px-2">
            Финансы и аналитика
          </div>
          {financesSection.map((item) => {
            const isActive = currentPage === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-auto py-2 px-2 text-white hover:bg-purple-600 hover:text-white rounded-md mb-1",
                  isActive && "bg-purple-600 shadow-lg"
                )}
                onClick={() => {
                  onPageChange(item.id)
                  onItemClick?.()
                }}
              >
                <div className="flex items-center space-x-2 w-full">
                  <div className={cn(
                    "p-1 rounded-md",
                    isActive ? "bg-white/20" : "bg-white/10"
                  )}>
                    <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  </div>
                  <span className="text-xs flex-1">{item.name}</span>
                </div>
              </Button>
            )
          })}
        </div>

        {/* Продвижение */}
        <div className="mb-4">
          <div className="text-xs font-medium text-purple-200 uppercase tracking-wider mb-2 px-2">
            Продвижение
          </div>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-left h-auto py-2 px-2 text-white hover:bg-purple-600 hover:text-white rounded-md mb-1",
              currentPage === 'marketing' && "bg-purple-600 shadow-lg"
            )}
            onClick={() => {
              onPageChange('marketing')
              onItemClick?.()
            }}
          >
            <div className="flex items-center space-x-2 w-full">
              <div className={cn(
                "p-1 rounded-md",
                currentPage === 'marketing' ? "bg-white/20" : "bg-white/10"
              )}>
                <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
              </div>
              <span className="text-xs flex-1">Реклама и продвижение</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-left h-auto py-2 px-2 text-white hover:bg-purple-600 hover:text-white rounded-md mb-1",
              currentPage === 'reviews' && "bg-purple-600 shadow-lg"
            )}
            onClick={() => {
              onPageChange('reviews')
              onItemClick?.()
            }}
          >
            <div className="flex items-center space-x-2 w-full">
              <div className={cn(
                "p-1 rounded-md",
                currentPage === 'reviews' ? "bg-white/20" : "bg-white/10"
              )}>
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
              </div>
              <span className="text-xs flex-1">Обзоры и видеообзоры</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </Button>
        </div>

        {/* Информация */}
        <div className="mb-4">
          <div className="text-xs font-medium text-purple-200 uppercase tracking-wider mb-2 px-2">
            Поддержка
          </div>
          {infoSection.map((item) => {
            const isActive = currentPage === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-auto py-2 px-2 text-white hover:bg-purple-600 hover:text-white rounded-md mb-1",
                  isActive && "bg-purple-600 shadow-lg"
                )}
                onClick={() => {
                  onPageChange(item.id)
                  onItemClick?.()
                }}
              >
                <div className="flex items-center space-x-2 w-full">
                  <div className={cn(
                    "p-1 rounded-md",
                    isActive ? "bg-white/20" : "bg-white/10"
                  )}>
                    <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  </div>
                  <span className="text-xs flex-1">{item.name}</span>
                </div>
              </Button>
            )
          })}
        </div>
      </nav>
      
      {/* Профиль пользователя */}
      <div className="p-3 border-t border-purple-600">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-white">
              {user.email?.split('@')[0] || 'Пользователь'}
            </p>
            <p className="text-xs text-purple-200">
              {user.email}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="w-full justify-start text-white hover:bg-purple-600 hover:text-white px-2 py-1.5 rounded-md"
        >
          <LogOut className="h-3 w-3 mr-2" />
          <span className="text-xs">Выход</span>
        </Button>
      </div>
    </>
  )
}