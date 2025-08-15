import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search, 
  Filter,
  Eye,
  MessageSquare,
  Phone,
  Calendar,
  ShoppingCart,
  MapPin,
  User,
  Mail,
  Star,
  TrendingUp
} from 'lucide-react'
import { supabase, auth } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'

interface Customer {
  id: string
  telegram_id: string
  telegram_username: string
  first_name: string
  last_name: string
  phone: string
  address: string
  created_at: string
  orders_count: number
  total_spent: number
  last_order_date: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const user = await auth.getCurrentUser()
      if (!user) return

      // Получаем магазины пользователя
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'active')

      if (storesError) throw storesError

      const storeIds = stores?.map(s => s.id) || []
      if (storeIds.length === 0) {
        setCustomers([])
        return
      }

      // Получаем клиентов с их статистикой заказов
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          orders!inner (
            id,
            total_amount,
            created_at,
            store_id
          )
        `)
        .in('orders.store_id', storeIds)

      if (customersError) throw customersError

      // Обрабатываем данные для получения статистики
      const processedCustomers = customersData?.reduce((acc: Customer[], customer: any) => {
        const existingCustomer = acc.find(c => c.id === customer.id)
        
        if (existingCustomer) {
          existingCustomer.orders_count += 1
          existingCustomer.total_spent += Number(customer.orders.total_amount)
          if (new Date(customer.orders.created_at) > new Date(existingCustomer.last_order_date)) {
            existingCustomer.last_order_date = customer.orders.created_at
          }
        } else {
          acc.push({
            id: customer.id,
            telegram_id: customer.telegram_id,
            telegram_username: customer.telegram_username,
            first_name: customer.first_name,
            last_name: customer.last_name,
            phone: customer.phone,
            address: customer.address,
            created_at: customer.created_at,
            orders_count: 1,
            total_spent: Number(customer.orders.total_amount),
            last_order_date: customer.orders.created_at
          })
        }
        
        return acc
      }, []) || []

      setCustomers(processedCustomers)
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase()
    const username = customer.telegram_username?.toLowerCase() || ''
    const phone = customer.phone?.toLowerCase() || ''
    
    return fullName.includes(searchQuery.toLowerCase()) ||
           username.includes(searchQuery.toLowerCase()) ||
           phone.includes(searchQuery.toLowerCase())
  })

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'name':
        aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
        bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
        break
      case 'orders':
        aValue = a.orders_count
        bValue = b.orders_count
        break
      case 'spent':
        aValue = a.total_spent
        bValue = b.total_spent
        break
      case 'date':
        aValue = new Date(a.last_order_date)
        bValue = new Date(b.last_order_date)
        break
      default:
        return 0
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getCustomerStats = () => {
    const total = customers.length
    const totalSpent = customers.reduce((sum, customer) => sum + customer.total_spent, 0)
    const avgOrderValue = total > 0 ? totalSpent / customers.reduce((sum, c) => sum + c.orders_count, 0) : 0
    const activeCustomers = customers.filter(c => 
      new Date(c.last_order_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
    
    return { total, totalSpent, avgOrderValue, activeCustomers }
  }

  const stats = getCustomerStats()

  const getCustomerSegment = (customer: Customer) => {
    if (customer.total_spent >= 10000) {
      return { label: 'VIP', color: 'bg-purple-100 text-purple-800' }
    } else if (customer.total_spent >= 5000) {
      return { label: 'Постоянный', color: 'bg-blue-100 text-blue-800' }
    } else if (customer.orders_count >= 3) {
      return { label: 'Активный', color: 'bg-green-100 text-green-800' }
    } else {
      return { label: 'Новый', color: 'bg-gray-100 text-gray-800' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-gray-600 mt-1">
            База данных клиентов ({customers.length} клиентов)
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего клиентов</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активные (30 дней)</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeCustomers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Общая выручка</p>
                <p className="text-2xl font-bold text-purple-600">{formatPrice(stats.totalSpent)}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Средний чек</p>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(stats.avgOrderValue)}</p>
              </div>
              <Star className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Поиск клиентов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field as any)
                setSortOrder(order as any)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="date-desc">Последний заказ (новые)</option>
              <option value="date-asc">Последний заказ (старые)</option>
              <option value="name-asc">По имени А-Я</option>
              <option value="name-desc">По имени Я-А</option>
              <option value="orders-desc">Больше заказов</option>
              <option value="orders-asc">Меньше заказов</option>
              <option value="spent-desc">Больше потратили</option>
              <option value="spent-asc">Меньше потратили</option>
            </select>
            
            <div className="text-sm text-gray-600 flex items-center">
              Найдено: {sortedCustomers.length} клиентов
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список клиентов */}
      <div className="space-y-4">
        {sortedCustomers.length > 0 ? (
          sortedCustomers.map((customer) => {
            const segment = getCustomerSegment(customer)
            const fullName = `${customer.first_name} ${customer.last_name}`.trim() || 'Неизвестный клиент'
            
            return (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{fullName}</h3>
                          <Badge className={segment.color}>
                            {segment.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          {customer.telegram_username && (
                            <div className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              @{customer.telegram_username}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              {customer.phone}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Последний заказ: {formatDate(new Date(customer.last_order_date))}
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Клиент с {formatDate(new Date(customer.created_at))}
                          </div>
                        </div>
                        
                        {customer.address && (
                          <div className="flex items-center mt-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {customer.address}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(customer.total_spent)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {customer.orders_count} заказ(ов)
                        </div>
                        <div className="text-sm text-gray-600">
                          Средний чек: {formatPrice(customer.total_spent / customer.orders_count)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>ID: {customer.telegram_id}</span>
                      <span>•</span>
                      <span>Регистрация: {formatDate(new Date(customer.created_at))}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Профиль
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Написать
                      </Button>
                      <Button size="sm" variant="outline">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Заказы
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              {customers.length === 0 ? (
                <>
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Нет клиентов
                  </h3>
                  <p className="text-gray-600">
                    Клиенты появятся после первых заказов в ваших магазинах
                  </p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Клиенты не найдены
                  </h3>
                  <p className="text-gray-600">
                    Попробуйте изменить параметры поиска
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}