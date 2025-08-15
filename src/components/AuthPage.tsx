import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Store, Phone, Mail, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'

export default function AuthPage() {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone')
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'verify'>('sign_in')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  const formatPhone = (value: string) => {
    // Удаляем все нецифровые символы
    const numbers = value.replace(/\D/g, '')
    // Форматируем как +7 (XXX) XXX-XX-XX
    if (numbers.length <= 1) return numbers
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Преобразуем телефон в формат E.164
      const cleanPhone = phone.replace(/\D/g, '')
      const phoneNumber = cleanPhone.startsWith('7') ? `+${cleanPhone}` : `+7${cleanPhone}`
      
      if (cleanPhone.length !== 11) {
        throw new Error('Введите корректный номер телефона')
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber
      })

      if (error) throw error

      setSuccess('Код подтверждения отправлен на ваш телефон')
      setView('verify')
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при отправке кода')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (view === 'sign_up') {
        const { error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) throw error
        setSuccess('Проверьте email для подтверждения регистрации')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const cleanPhone = phone.replace(/\D/g, '')
      const phoneNumber = cleanPhone.startsWith('7') ? `+${cleanPhone}` : `+7${cleanPhone}`
      
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms'
      })

      if (error) throw error
      // Успешная авторизация - компонент App перенаправит пользователя
    } catch (err: any) {
      setError(err.message || 'Неверный код подтверждения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-700 rounded-xl flex items-center justify-center">
              <Store className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">TS Partners</span>
          </div>
          <p className="text-gray-600">
            Платформа для управления Telegram магазинами
          </p>
        </div>

        {/* Форма авторизации */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-bold text-gray-900">
              {view === 'verify' ? 'Подтверждение' : view === 'sign_in' ? 'Вход в систему' : 'Регистрация'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {view === 'verify'
                ? 'Введите код из SMS'
                : view === 'sign_in' 
                ? 'Войдите в свой аккаунт' 
                : 'Создайте новый аккаунт'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view !== 'verify' && (
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-colors ${
                    authMethod === 'phone'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Телефон
                </button>
                <button
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-colors ${
                    authMethod === 'email'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {view === 'verify' ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Код подтверждения
                  </label>
                  <Input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Введите 6-значный код"
                    className="text-center text-lg font-semibold tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-purple-700 hover:bg-purple-800"
                >
                  {loading ? 'Проверка...' : 'Подтвердить'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setView('sign_in')
                    setOtp('')
                    setError(null)
                    setSuccess(null)
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-900"
                >
                  Назад
                </button>
              </form>
            ) : authMethod === 'phone' ? (
              <form onSubmit={handlePhoneAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Номер телефона
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+7 (999) 999-99-99"
                    className="font-medium"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || phone.replace(/\D/g, '').length !== 11}
                  className="w-full bg-purple-700 hover:bg-purple-800"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      Получить код
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="inline h-4 w-4 mr-1" />
                    Пароль
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-700 hover:bg-purple-800"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {view === 'sign_in' ? 'Вход...' : 'Регистрация...'}
                    </>
                  ) : (
                    <>
                      {view === 'sign_in' ? 'Войти' : 'Зарегистрироваться'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}
            
            {view !== 'verify' && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setView(view === 'sign_in' ? 'sign_up' : 'sign_in')
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  {view === 'sign_in' 
                    ? 'Нет аккаунта? Зарегистрироваться' 
                    : 'Есть аккаунт? Войти'
                  }
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Футер */}
        <div className="text-center mt-6 text-xs text-gray-500">
          © 2025 TS Partners. Все права защищены.
        </div>
      </div>
    </div>
  )
}
