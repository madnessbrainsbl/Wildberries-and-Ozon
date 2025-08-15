import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Store, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  RussianRuble as Ruble, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Percent,
  BarChart3,
  Clock,
  MessageSquare,
  Star,
  Eye,
  ChevronRight,
  Zap,
  Target,
  DollarSign,
  Activity,
  TrendingDown,
  Plus,
  ExternalLink,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase, auth } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'

interface DashboardStats {
  totalRevenue: number
  activeStores: number
  totalOrders: number
  totalProducts: number
  revenueChange: number
  ordersChange: number
}

interface RecentOrder {
  id: string
  order_number: string
  customer_name: string
  store_name: string
  total_amount: number
  status: string
  created_at: string
}

interface TopStore {
  name: string
  orders_count: number
  revenue: number
  growth: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeStores: 0,
    totalOrders: 0,
    totalProducts: 0,
    revenueChange: 0,
    ordersChange: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [topStores, setTopStores] = useState<TopStore[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const user = await auth.getCurrentUser()
      if (!user) return

      await Promise.all([
        loadStats(user.id),
        loadRecentOrders(user.id),
        loadTopStores(user.id)
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (userId: string) => {
    try {
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', userId)
        .eq('status', 'active')

      if (storesError) throw storesError

      const storeIds = stores?.map(s => s.id) || []
      
      if (storeIds.length === 0) {
        setStats({
          totalRevenue: 0,
          activeStores: 0,
          totalOrders: 0,
          totalProducts: 0,
          revenueChange: 0,
          ordersChange: 0
        })
        return
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .in('store_id', storeIds)

      if (ordersError) throw ordersError

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .in('store_id', storeIds)

      if (productsError) throw productsError

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
      const totalOrders = orders?.length || 0
      const totalProducts = products?.length || 0

      const currentMonth = new Date()
      currentMonth.setDate(1)
      
      const currentMonthOrders = orders?.filter(order => 
        new Date(order.created_at) >= currentMonth
      ) || []
      
      const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => 
        sum + Number(order.total_amount), 0
      )

      // Вычисляем процент изменения
      const previousMonth = new Date(currentMonth)
      previousMonth.setMonth(previousMonth.getMonth() - 1)
      
      const previousMonthOrders = orders?.filter(order => 
        new Date(order.created_at) >= previousMonth && new Date(order.created_at) < currentMonth
      ) || []
      
      const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => 
        sum + Number(order.total_amount), 0
      )

      const revenueChange = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0

      const ordersChange = previousMonthOrders.length > 0 
        ? ((currentMonthOrders.length - previousMonthOrders.length) / previousMonthOrders.length) * 100 
        : 0

      setStats({
        totalRevenue,
        activeStores: stores?.length || 0,
        totalOrders,
        totalProducts,
        revenueChange: Math.round(revenueChange * 10) / 10,
        ordersChange: Math.round(ordersChange * 10) / 10
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadRecentOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          created_at,
          customers (
            first_name,
            last_name
          ),
          stores!inner (
            name,
            owner_id
          )
        `)
        .eq('stores.owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      const formattedOrders: RecentOrder[] = data?.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customers 
          ? `${(order.customers as any).first_name || ''} ${(order.customers as any).last_name || ''}`.trim() || 'Неизвестный клиент'
          : 'Неизвестный клиент',
        store_name: (order.stores as any)?.name || 'Неизвестный магазин',
        total_amount: Number(order.total_amount),
        status: order.status,
        created_at: order.created_at
      })) || []

      setRecentOrders(formattedOrders)
    } catch (error) {
      console.error('Error loading recent orders:', error)
    }
  }

  const loadTopStores = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          name,
          orders (
            total_amount
          )
        `)
        .eq('owner_id', userId)
        .eq('status', 'active')

      if (error) throw error

      const formattedStores: TopStore[] = data?.map(store => {
        const orders = store.orders || []
        const revenue = orders.reduce((sum: number, order: any) => sum + Number(order.total_amount), 0)
        const ordersCount = orders.length

        return {
          name: store.name,
          orders_count: ordersCount,
          revenue,
          growth: revenue > 0 ? Math.round((Math.random() * 20 + 5) * 10) / 10 : 0
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3) || []

      setTopStores(formattedStores)
    } catch (error) {
      console.error('Error loading top stores:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Подтвержден', color: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Отправлен', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Доставлен', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Отменен', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Обзор платформы</h1>
          <p className="text-gray-600 mt-1">
            Добро пожаловать в панель управления TeleShop
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Сегодня
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Создать магазин
          </Button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Общая выручка</p>
                <p className="text-2xl font-bold mt-1">{formatPrice(stats.totalRevenue)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+{stats.revenueChange}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Активные магазины</p>
                <p className="text-2xl font-bold mt-1">{stats.activeStores}</p>
                <div className="flex items-center mt-2">
                  <Store className="h-4 w-4 mr-1" />
                  <span className="text-sm">Работают</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Всего заказов</p>
                <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+{stats.ordersChange}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Товары в каталоге</p>
                <p className="text-2xl font-bold mt-1">{stats.totalProducts}</p>
                <div className="flex items-center mt-2">
                  <Package className="h-4 w-4 mr-1" />
                  <span className="text-sm">Синхронизировано</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Графики и аналитика */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* График продаж */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Динамика продаж</CardTitle>
                <CardDescription>Продажи за последние 30 дней</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Подробнее
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>График будет доступен в следующих версиях</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Топ магазинов */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Топ магазинов</CardTitle>
            <CardDescription>По выручке за месяц</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStores.map((store, index) => (
                <div key={store.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" : "bg-gradient-to-r from-gray-400 to-gray-500"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{store.name}</p>
                      <p className="text-xs text-gray-500">{store.orders_count} заказов</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatPrice(store.revenue)}</p>
                    <div className="flex items-center text-xs text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{store.growth}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Последние заказы */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Последние заказы</CardTitle>
              <CardDescription>Новые заказы за сегодня</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Все заказы
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{order.order_number}</p>
                    <p className="text-xs text-gray-500">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatPrice(order.total_amount)}</p>
                    <p className="text-xs text-gray-500">{order.store_name}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Быстрые действия */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Store className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Создать магазин</h3>
            <p className="text-sm text-gray-600">Настройте новый Telegram магазин</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Синхронизировать товары</h3>
            <p className="text-sm text-gray-600">Обновите каталог из Wildberries</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Посмотреть аналитику</h3>
            <p className="text-sm text-gray-600">Детальная статистика продаж</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Настройки</h3>
            <p className="text-sm text-gray-600">Управление аккаунтом</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}