import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Store, 
  Settings, 
  ExternalLink, 
  Trash2,
  Edit,
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Globe,
  Bot,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign
} from 'lucide-react'
import { supabase, Store as StoreType } from '@/lib/supabase'
import { syncStoreProducts as syncProducts } from '@/lib/wildberries'
import { syncOzonProducts } from '@/lib/ozon'
import { setTelegramWebhook } from '@/lib/telegram'
import { auth } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function StoresPage() {
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingStore, setEditingStore] = useState<StoreType | null>(null)
  const [syncingStores, setSyncingStores] = useState<Set<string>>(new Set())
  const [settingWebhookForStore, setSettingWebhookForStore] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    telegram_bot_token: '',
    wildberries_token: '',
    ozon_client_id: '',
    ozon_api_key: ''
  })

  useEffect(() => {
    loadStores()
  }, [])

const loadStores = async () => {
    setLoading(true)
    try {
      const user = await auth.getCurrentUser()
      if (!user) {
        setStores([])
        return
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading stores:', error)
        setStores([])
        return
      }
      setStores(data || [])
    } catch (error) {
      console.error('Error loading stores:', error)
      setStores([])
    } finally {
      setLoading(false)
    }
  }

const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      const user = await auth.getCurrentUser()
      if (!user) {
        alert('Необходимо войти в систему')
        return
      }

      const { data, error } = await supabase
        .from('stores')
        .insert({
          ...formData,
          owner_id: user.id,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating store:', error)
        alert('Ошибка при создании магазина: ' + error.message)
        return
      }

      setStores([data, ...stores])
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        telegram_bot_token: '',
        wildberries_token: '',
        ozon_client_id: '',
        ozon_api_key: ''
      })
      
      alert('Магазин успешно создан!')
    } catch (error) {
      console.error('Error creating store:', error)
      alert('Ошибка при создании магазина')
    } finally {
      setLoading(false)
    }
  }

  const handleEditStore = async (store: StoreType) => {
    setEditingStore(store)
    setFormData({
      name: store.name,
      description: store.description || '',
      telegram_bot_token: store.telegram_bot_token,
      wildberries_token: store.wildberries_token || '',
      ozon_client_id: store.ozon_client_id || '',
      ozon_api_key: store.ozon_api_key || ''
    })
    setShowCreateForm(true)
  }

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingStore) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          description: formData.description,
          telegram_bot_token: formData.telegram_bot_token,
          wildberries_token: formData.wildberries_token,
          ozon_client_id: formData.ozon_client_id,
          ozon_api_key: formData.ozon_api_key,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingStore.id)

      if (error) {
        console.error('Error updating store:', error)
        alert('Ошибка при обновлении магазина: ' + error.message)
        return
      }

      // Обновляем список магазинов
      setStores(stores.map(s => 
        s.id === editingStore.id 
          ? { ...s, ...formData, updated_at: new Date().toISOString() }
          : s
      ))
      
      setEditingStore(null)
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        telegram_bot_token: '',
        wildberries_token: '',
        ozon_client_id: '',
        ozon_api_key: ''
      })
      
      alert('Магазин успешно обновлен')
    } catch (error) {
      console.error('Error updating store:', error)
      alert('Ошибка при обновлении магазина')
    } finally {
      setLoading(false)
    }
  }

  const syncStoreProducts = async (store: StoreType, marketplace: 'wildberries' | 'ozon') => {
    const syncKey = `${store.id}-${marketplace}`
    setSyncingStores(prev => new Set(prev).add(syncKey))
    
    try {
      if (marketplace === 'wildberries') {
        const result = await syncProducts(store.id)
        if (result.success) {
          alert(`Синхронизация с Wildberries завершена!\nСинхронизировано: ${result.synced_count} товаров\nОшибок: ${result.error_count || 0}`)
        } else {
          alert(`Ошибка синхронизации Wildberries: ${result.error}`)
        }
      } else {
        const result = await syncOzonProducts(store.id)
        if (result.success) {
          alert(`Синхронизация с Ozon завершена!\nСинхронизировано: ${result.synced_count} товаров\nОшибок: ${result.error_count || 0}`)
        } else {
          alert(`Ошибка синхронизации Ozon: ${result.error}`)
        }
      }
    } catch (error) {
      console.error(`Error syncing ${marketplace}:`, error)
      alert(`Ошибка при синхронизации с ${marketplace === 'wildberries' ? 'Wildberries' : 'Ozon'}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setSyncingStores(prev => {
        const newSet = new Set(prev)
        newSet.delete(syncKey)
        return newSet
      })
    }
  }

  const handleSetWebhook = async (store: StoreType) => {
    setSettingWebhookForStore(prev => new Set(prev).add(store.id))
    
    try {
      await setTelegramWebhook(store.telegram_bot_token)
      alert('Webhook успешно настроен!')
    } catch (error) {
      console.error('Error setting webhook:', error)
      alert('Ошибка при настройке webhook')
    } finally {
      setSettingWebhookForStore(prev => {
        const newSet = new Set(prev)
        newSet.delete(store.id)
        return newSet
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Активен', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Неактивен', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка магазинов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление магазинами</h1>
          <p className="text-gray-600 mt-1">
            Создавайте и управляйте вашими Telegram магазинами
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Создать магазин
        </Button>
      </div>

      {/* Статистика магазинов */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Всего магазинов</p>
                <p className="text-2xl font-bold mt-1">{stores.length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Активных</p>
                <p className="text-2xl font-bold mt-1">{stores.filter(s => s.status === 'active').length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">С Wildberries</p>
                <p className="text-2xl font-bold mt-1">{stores.filter(s => s.wildberries_token).length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">С Ozon</p>
                <p className="text-2xl font-bold mt-1">{stores.filter(s => s.ozon_client_id && s.ozon_api_key).length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Форма создания/редактирования магазина */}
      {showCreateForm && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              {editingStore ? 'Редактировать магазин' : 'Создать новый магазин'}
            </CardTitle>
            <CardDescription>
              {editingStore 
                ? 'Обновите настройки вашего Telegram магазина'
                : 'Подключите Telegram бота и токены маркетплейсов для начала работы'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingStore ? handleUpdateStore : handleCreateStore} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Название магазина
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Мой магазин электроники"
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Описание
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Лучшие товары для дома"
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-purple-600" />
                  Telegram Bot
                </h3>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Токен Telegram бота
                  </label>
                  <Input
                    required
                    type="password"
                    value={formData.telegram_bot_token}
                    onChange={(e) => setFormData({ ...formData, telegram_bot_token: e.target.value })}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Получите токен у @BotFather в Telegram
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-green-600" />
                  Wildberries
                </h3>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    API ключ Wildberries
                  </label>
                  <Input
                    type="password"
                    value={formData.wildberries_token}
                    onChange={(e) => setFormData({ ...formData, wildberries_token: e.target.value })}
                    placeholder="Стандартный ключ API Wildberries"
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Получите ключ в личном кабинете Wildberries в разделе API
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-blue-600" />
                  Ozon (опционально)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Client ID Ozon
                    </label>
                    <Input
                      value={formData.ozon_client_id}
                      onChange={(e) => setFormData({ ...formData, ozon_client_id: e.target.value })}
                      placeholder="123456"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Получите в личном кабинете Ozon в разделе API
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      API ключ Ozon
                    </label>
                    <Input
                      type="password"
                      value={formData.ozon_api_key}
                      onChange={(e) => setFormData({ ...formData, ozon_api_key: e.target.value })}
                      placeholder="API ключ Ozon"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Получите в личном кабинете Ozon в разделе API
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {editingStore ? 'Обновление...' : 'Создание...'}
                    </>
                  ) : (
                    <>
                      <Store className="h-4 w-4 mr-2" />
                      {editingStore ? 'Обновить магазин' : 'Создать магазин'}
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingStore(null)
                    setFormData({
                      name: '',
                      description: '',
                      telegram_bot_token: '',
                      wildberries_token: '',
                      ozon_client_id: '',
                      ozon_api_key: ''
                    })
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Список магазинов */}
      {stores.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card key={store.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <CardDescription>{store.description}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(store.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Интеграции */}
                  <div className="flex flex-wrap gap-2">
                    {store.telegram_bot_token && (
                      <Badge className="bg-green-100 text-green-800">
                        <Bot className="h-3 w-3 mr-1" />
                        Telegram
                      </Badge>
                    )}
                    {store.wildberries_token && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Package className="h-3 w-3 mr-1" />
                        Wildberries
                      </Badge>
                    )}
                    {store.ozon_client_id && store.ozon_api_key && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <Globe className="h-3 w-3 mr-1" />
                        Ozon
                      </Badge>
                    )}
                  </div>

                  {/* Статистика магазина */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Package className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <p className="text-sm font-medium">Товары</p>
                      <p className="text-lg font-bold">-</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <p className="text-sm font-medium">Заказы</p>
                      <p className="text-lg font-bold">-</p>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditStore(store)}
                      className="hover:bg-purple-50 hover:border-purple-200"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Настройки
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSetWebhook(store)}
                      disabled={settingWebhookForStore.has(store.id)}
                      className="hover:bg-blue-50 hover:border-blue-200"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {settingWebhookForStore.has(store.id) ? 'Настройка...' : 'Webhook'}
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2">
                    {store.wildberries_token && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => syncStoreProducts(store, 'wildberries')}
                        disabled={syncingStores.has(`${store.id}-wildberries`)}
                        className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        {syncingStores.has(`${store.id}-wildberries`) ? 'Синхронизация WB...' : 'Синхронизация WB'}
                      </Button>
                    )}
                    {store.ozon_client_id && store.ozon_api_key && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => syncStoreProducts(store, 'ozon')}
                        disabled={syncingStores.has(`${store.id}-ozon`)}
                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        {syncingStores.has(`${store.id}-ozon`) ? 'Синхронизация Ozon...' : 'Синхронизация Ozon'}
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Создан {new Date(store.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет созданных магазинов
            </h3>
            <p className="text-gray-600 mb-6">
              Создайте свой первый Telegram магазин для начала продаж
            </p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать первый магазин
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}