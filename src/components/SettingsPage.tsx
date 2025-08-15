import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Key, 
  Mail, 
  Phone, 
  Globe, 
  Palette,
  Database,
  Webhook,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Trash2,
  AlertTriangle
} from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [profile, setProfile] = useState({
    email: 'user@example.com',
    full_name: '',
    company: '',
    phone: '',
    website: ''
  })
  const [notifications, setNotifications] = useState({
    email_orders: true,
    email_products: false,
    email_marketing: true,
    push_orders: true,
    push_products: true,
    push_marketing: false
  })
  const [security, setSecurity] = useState({
    two_factor: false,
    login_alerts: true,
    api_access: true
  })

  const updateProfile = async () => {
    setLoading(true)
    try {
      // Имитация обновления профиля
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Профиль успешно обновлен')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Ошибка при обновлении профиля')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    try {
      alert('Инструкции по смене пароля отправлены на email')
    } catch (error) {
      console.error('Error sending password reset:', error)
      alert('Ошибка при отправке инструкций')
    }
  }

  const deleteAccount = async () => {
    if (!confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
      return
    }

    try {
      alert('Функция удаления аккаунта будет доступна в следующих версиях')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Ошибка при удалении аккаунта')
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-600 mt-1">
          Управление настройками аккаунта и платформы
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="billing">Тарифы</TabsTrigger>
        </TabsList>

        {/* Профиль */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Личная информация
                  </CardTitle>
                  <CardDescription>
                    Обновите информацию о вашем профиле
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email нельзя изменить
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Полное имя</label>
                      <Input
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Иван Иванов"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Компания</label>
                      <Input
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        placeholder="ООО Моя компания"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Телефон</label>
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Веб-сайт</label>
                    <Input
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://mycompany.com"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button onClick={updateProfile} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Аватар</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-12 w-12 text-purple-600" />
                  </div>
                  <Button variant="outline" size="sm">
                    Загрузить фото
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG до 2MB
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Уведомления */}
        <TabsContent value="notifications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email уведомления
                </CardTitle>
                <CardDescription>
                  Настройте получение уведомлений на email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Новые заказы</p>
                    <p className="text-sm text-gray-600">Уведомления о новых заказах</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_orders}
                    onChange={(e) => setNotifications({ ...notifications, email_orders: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Обновления товаров</p>
                    <p className="text-sm text-gray-600">Синхронизация с Wildberries</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_products}
                    onChange={(e) => setNotifications({ ...notifications, email_products: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Маркетинг</p>
                    <p className="text-sm text-gray-600">Новости и обновления платформы</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_marketing}
                    onChange={(e) => setNotifications({ ...notifications, email_marketing: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Push уведомления
                </CardTitle>
                <CardDescription>
                  Настройте push-уведомления в браузере
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Новые заказы</p>
                    <p className="text-sm text-gray-600">Мгновенные уведомления</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push_orders}
                    onChange={(e) => setNotifications({ ...notifications, push_orders: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Обновления товаров</p>
                    <p className="text-sm text-gray-600">Статус синхронизации</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push_products}
                    onChange={(e) => setNotifications({ ...notifications, push_products: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Маркетинг</p>
                    <p className="text-sm text-gray-600">Промо и акции</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push_marketing}
                    onChange={(e) => setNotifications({ ...notifications, push_marketing: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Безопасность */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Безопасность аккаунта
                </CardTitle>
                <CardDescription>
                  Настройки безопасности и доступа к аккаунту
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Смена пароля</p>
                    <p className="text-sm text-gray-600">Обновите пароль для входа</p>
                  </div>
                  <Button variant="outline" onClick={changePassword}>
                    <Key className="h-4 w-4 mr-2" />
                    Сменить пароль
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Двухфакторная аутентификация</p>
                    <p className="text-sm text-gray-600">Дополнительная защита аккаунта</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={security.two_factor ? "default" : "outline"}>
                      {security.two_factor ? 'Включена' : 'Отключена'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      {security.two_factor ? 'Отключить' : 'Включить'}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Уведомления о входе</p>
                    <p className="text-sm text-gray-600">Email при входе с нового устройства</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={security.login_alerts}
                    onChange={(e) => setSecurity({ ...security, login_alerts: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Опасная зона
                </CardTitle>
                <CardDescription>
                  Необратимые действия с аккаунтом
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <p className="font-medium text-red-600">Удалить аккаунт</p>
                    <p className="text-sm text-gray-600">
                      Полное удаление аккаунта и всех данных
                    </p>
                  </div>
                  <Button variant="outline" onClick={deleteAccount} className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                API ключи
              </CardTitle>
              <CardDescription>
                Управление API ключами для интеграций
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Основной API ключ</p>
                    <p className="text-sm text-gray-600">Для доступа к API платформы</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Активен</Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value="sk_live_1234567890abcdef"
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Обновить
                  </Button>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Webhook URL</p>
                    <p className="text-sm text-gray-600">Для получения уведомлений</p>
                  </div>
                </div>
                
                <Input
                  placeholder="https://your-domain.com/webhook"
                  className="mb-2"
                />
                <Button variant="outline" size="sm">
                  <Webhook className="h-4 w-4 mr-2" />
                  Тестировать
                </Button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Документация API</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Изучите нашу документацию для интеграции с платформой
                </p>
                <Button variant="outline" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  Открыть документацию
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Тарифы */}
        <TabsContent value="billing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Текущий тариф
                </CardTitle>
                <CardDescription>
                  Управление подпиской и тарифным планом
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-6 bg-purple-50 rounded-lg">
                  <div>
                    <h3 className="text-xl font-bold text-purple-900">Базовый план</h3>
                    <p className="text-purple-700">До 3 магазинов, 1000 товаров</p>
                    <p className="text-sm text-purple-600 mt-1">
                      Следующее списание: 25 ноября 2024
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-900">₽990</div>
                    <div className="text-purple-700">в месяц</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle>Стартовый</CardTitle>
                  <CardDescription>Для начинающих</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">₽490</div>
                  <ul className="space-y-2 text-sm">
                    <li>• 1 магазин</li>
                    <li>• 500 товаров</li>
                    <li>• Базовая аналитика</li>
                    <li>• Email поддержка</li>
                  </ul>
                  <Button variant="outline" className="w-full mt-4">
                    Выбрать план
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-purple-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600">Текущий</Badge>
                </div>
                <CardHeader>
                  <CardTitle>Базовый</CardTitle>
                  <CardDescription>Оптимальный выбор</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">₽990</div>
                  <ul className="space-y-2 text-sm">
                    <li>• 3 магазина</li>
                    <li>• 1000 товаров</li>
                    <li>• Расширенная аналитика</li>
                    <li>• Приоритетная поддержка</li>
                  </ul>
                  <Button className="w-full mt-4" disabled>
                    Активен
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle>Профессиональный</CardTitle>
                  <CardDescription>Для больших объемов</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">₽1990</div>
                  <ul className="space-y-2 text-sm">
                    <li>• Безлимит магазинов</li>
                    <li>• Безлимит товаров</li>
                    <li>• Полная аналитика</li>
                    <li>• Персональный менеджер</li>
                  </ul>
                  <Button className="w-full mt-4">
                    Обновить
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}