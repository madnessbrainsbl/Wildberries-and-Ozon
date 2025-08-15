import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingCart, Search, Filter, Eye, Edit, Trash2, Package, Clock, CheckCircle, XCircle, Truck, Calendar, User, Phone, MapPin, RussianRuble as Ruble } from 'lucide-react'
import { supabase, auth } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  delivery_address: string
  delivery_method: string
  payment_method: string
  notes: string
  created_at: string
  customers: {
    first_name: string
    last_name: string
    phone: string
    telegram_username: string
  }
  stores: {
    name: string
  }
  order_items: Array<{
    quantity: number
    price: number
    products: {
      name: string
      images: string[]
    }
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedStore, setSelectedStore] = useState('all')
  const [stores, setStores] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const user = await auth.getCurrentUser()
      if (!user) return

      // Загружаем магазины пользователя
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('owner_id', user.id)
        .eq('status', 'active')

      if (storesError) throw storesError
      setStores(storesData || [])

      // Загружаем заказы
      const storeIds = storesData?.map(s => s.id) || []
      if (storeIds.length === 0) {
        setOrders([])
        return
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            phone,
            telegram_username
          ),
          stores (
            name
          ),
          order_items (
            quantity,
            price,
            products (
              name,
              images
            )
          )
        `)
        .in('store_id', storeIds)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError
      setOrders(ordersData || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Ошибка при обновлении статуса заказа')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customers?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customers?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesStore = selectedStore === 'all' || order.store_id === selectedStore
    return matchesSearch && matchesStatus && matchesStore
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: 'Подтвержден', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      shipped: { label: 'Отправлен', color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { label: 'Доставлен', color: 'bg-green-100 text-green-800', icon: Package },
      cancelled: { label: 'Отменен', color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getOrderStats = () => {
    const total = orders.length
    const pending = orders.filter(o => o.status === 'pending').length
    const confirmed = orders.filter(o => o.status === 'confirmed').length
    const delivered = orders.filter(o => o.status === 'delivered').length
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0)
    
    return { total, pending, confirmed, delivered, totalRevenue }
  }

  const stats = getOrderStats()

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
          <h1 className="text-3xl font-bold text-gray-900">Заказы</h1>
          <p className="text-gray-600 mt-1">
            Управление заказами клиентов ({orders.length} заказов)
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего заказов</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ожидают</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Подтверждены</p>
                <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Доставлены</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Выручка</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <Ruble className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Поиск заказов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Все магазины</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Все статусы</option>
              <option value="pending">Ожидает</option>
              <option value="confirmed">Подтвержден</option>
              <option value="shipped">Отправлен</option>
              <option value="delivered">Доставлен</option>
              <option value="cancelled">Отменен</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Список заказов */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Заказ №{order.order_number}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {order.customers?.first_name} {order.customers?.last_name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(new Date(order.created_at))}
                        </div>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          {order.stores?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {formatPrice(order.total_amount)}
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Товары в заказе */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Товары ({order.order_items?.length || 0}):</h4>
                  <div className="space-y-2">
                    {order.order_items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 text-sm">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          {item.products?.images?.[0] ? (
                            <img 
                              src={item.products.images[0]} 
                              alt="" 
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Package className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <span className="flex-1">{item.products?.name}</span>
                        <span className="text-gray-600">×{item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                    {(order.order_items?.length || 0) > 3 && (
                      <p className="text-sm text-gray-500">
                        и еще {(order.order_items?.length || 0) - 3} товар(ов)
                      </p>
                    )}
                  </div>
                </div>

                {/* Контактная информация */}
                {(order.customers?.phone || order.delivery_address) && (
                  <div className="border-t pt-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {order.customers?.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{order.customers.phone}</span>
                        </div>
                      )}
                      {order.delivery_address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{order.delivery_address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Действия */}
                <div className="border-t pt-4 mt-4 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Подробнее
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Редактировать
                    </Button>
                  </div>
                  
                  {order.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Подтвердить
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Отменить
                      </Button>
                    </div>
                  )}
                  
                  {order.status === 'confirmed' && (
                    <Button 
                      size="sm" 
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Отправить
                    </Button>
                  )}
                  
                  {order.status === 'shipped' && (
                    <Button 
                      size="sm" 
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Доставлен
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              {orders.length === 0 ? (
                <>
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Нет заказов
                  </h3>
                  <p className="text-gray-600">
                    Заказы появятся после того, как клиенты начнут покупать товары
                  </p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Заказы не найдены
                  </h3>
                  <p className="text-gray-600">
                    Попробуйте изменить параметры поиска или фильтры
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