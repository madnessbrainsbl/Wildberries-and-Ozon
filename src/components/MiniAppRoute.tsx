import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  ShoppingCart, 
  Star,
  Plus,
  Minus,
  Heart,
  ArrowLeft,
  Package,
  Home,
  User,
  MessageSquare,
  ChevronRight,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Camera,
  Shield
} from 'lucide-react'
import { supabase, Product } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

interface CartItem {
  product: Product
  quantity: number
}

interface Review {
  id: string
  text: string
  pros: string
  cons: string
  productValuation: number
  createdDate: string
  userName: string
  photoLinks: string[]
  answer?: {
    text: string
    createdDate: string
  }
  matchingSize: string
}

interface MiniAppRouteProps {
  storeId: string
}

type ViewMode = 'catalog' | 'cart' | 'profile' | 'product-detail'

export default function MiniAppRoute({ storeId }: MiniAppRouteProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [currentView, setCurrentView] = useState<ViewMode>('catalog')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productReviews, setProductReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  useEffect(() => {
    loadStoreData()
    
    // Проверяем URL параметры для фильтрации по маркетплейсу
    const urlParams = new URLSearchParams(window.location.search)
    const marketplaceParam = urlParams.get('marketplace')
    if (marketplaceParam === 'wildberries' || marketplaceParam === 'ozon') {
      setSelectedCategory(marketplaceParam)
    }
  }, [storeId])

  const loadStoreData = async () => {
    try {
      console.log('Loading store data for storeId:', storeId)
      
      // Загружаем информацию о магазине
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, description')
        .eq('id', storeId)
        .single()

      console.log('Store query result:', { storeData, storeError })

      if (storeError) throw storeError
      setStore(storeData)

      // Загружаем товары магазина
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      console.log('Products query result:', { productsData, productsError })

      if (productsError) throw productsError
      setProducts(productsData || [])
    } catch (error) {
      console.error('Error loading store data for storeId:', storeId, error)
    } finally {
      setLoading(false)
    }
  }

  const loadProductReviews = async (product: Product) => {
    setReviewsLoading(true)
    try {
      console.log('Loading reviews for product:', product.wb_id, 'store:', storeId)
      
      // Здесь будет вызов Edge Function для получения отзывов
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-product-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_id: storeId,
          wb_id: product.wb_id
        })
      })

      console.log('Reviews API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Reviews API response data:', data)
        setProductReviews(data.reviews || [])
      } else {
        const errorText = await response.text()
        console.error('Reviews API error:', response.status, errorText)
        // Fallback: показываем моковые отзывы
        setProductReviews(getMockReviews())
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      // Показываем моковые отзывы при ошибке
      setProductReviews(getMockReviews())
    } finally {
      setReviewsLoading(false)
    }
  }

  const getMockReviews = (): Review[] => [
    {
      id: '1',
      text: 'Отличный товар! Качество превзошло ожидания. Быстрая доставка.',
      pros: 'Качественный материал, удобный',
      cons: 'Нет недостатков',
      productValuation: 5,
      createdDate: '2024-01-15T10:30:00Z',
      userName: 'Анна К.',
      photoLinks: [],
      matchingSize: 'ok',
      answer: {
        text: 'Спасибо за отзыв! Рады, что товар вам понравился!',
        createdDate: '2024-01-16T09:15:00Z'
      }
    },
    {
      id: '2',
      text: 'Хороший товар за свою цену. Рекомендую к покупке.',
      pros: 'Доступная цена, быстрая доставка',
      cons: 'Упаковка могла быть лучше',
      productValuation: 4,
      createdDate: '2024-01-10T14:20:00Z',
      userName: 'Михаил П.',
      photoLinks: [],
      matchingSize: 'ok'
    },
    {
      id: '3',
      text: 'Товар соответствует описанию. Качество хорошее.',
      pros: 'Соответствует описанию',
      cons: 'Долго ждал доставку',
      productValuation: 4,
      createdDate: '2024-01-05T16:45:00Z',
      userName: 'Елена С.',
      photoLinks: [],
      matchingSize: 'small'
    }
  ]

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      return prevCart.reduce((acc, item) => {
        if (item.product.id === productId) {
          if (item.quantity > 1) {
            acc.push({ ...item, quantity: item.quantity - 1 })
          }
        } else {
          acc.push(item)
        }
        return acc
      }, [] as CartItem[])
    })
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const handleCheckout = () => {
    if (cart.length === 0) return
    
    // Если мы в Telegram WebApp, отправляем данные корзины в бота
    if (window.Telegram?.WebApp) {
      const cartData = {
        action: 'checkout',
        cart: cart.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            marketplace: item.product.marketplace,
            sku: item.product.marketplace_id || item.product.wb_id || item.product.sku,
            image_url: item.product.images?.[0]
          },
          quantity: item.quantity
        }))
      }
      
      // Отправляем данные в бота
      window.Telegram.WebApp.sendData(JSON.stringify(cartData))
      
      // Показываем уведомление
      window.Telegram.WebApp.showAlert('Корзина отправлена в бота для оформления заказа')
    } else {
      // Если не в Telegram, используем старую логику
      const wildberriesItems = cart.filter(item => item.product.marketplace === 'wildberries')
      const ozonItems = cart.filter(item => item.product.marketplace === 'ozon')
      
      if (wildberriesItems.length > 0 && ozonItems.length > 0) {
        const choice = confirm(
          'У вас есть товары из разных магазинов.\n\n' +
          `Wildberries: ${wildberriesItems.length} товар(ов)\n` +
          `Ozon: ${ozonItems.length} товар(ов)\n\n` +
          'Нажмите OK для Wildberries или Отмена для Ozon'
        )
        
        if (choice) {
          openWildberries(wildberriesItems)
        } else {
          openOzon(ozonItems)
        }
      } else if (wildberriesItems.length > 0) {
        openWildberries(wildberriesItems)
      } else {
        openOzon(ozonItems)
      }
    }
  }

  const openMarketplace = (marketplace: 'wildberries' | 'ozon', products: CartItem[]) => {
    if (marketplace === 'wildberries') {
      openWildberries(products)
    } else {
      openOzon(products)
    }
  }

  const openWildberries = (products: CartItem[]) => {
    const wbIds = products.map(item => item.product.marketplace_id || item.product.wb_id).join(',')
    
    // Deep link для приложения Wildberries
    const wbAppLink = `wildberries://products?ids=${wbIds}`
    // Fallback web ссылка для браузера
    const wbWebLink = products.length === 1 
      ? `https://www.wildberries.ru/catalog/${products[0].product.marketplace_id || products[0].product.wb_id}/detail.aspx`
      : `https://www.wildberries.ru/catalog/0/search.aspx?search=${wbIds}`
    
    console.log('Opening Wildberries with products:', { wbIds, wbAppLink, wbWebLink })
    
    if (window.Telegram?.WebApp) {
      // В Telegram WebApp пытаемся открыть приложение WB
      try {
        // Сначала пытаемся открыть приложение
        window.open(wbAppLink, '_blank')
        
        // Если не получилось, через секунду открываем веб-версию
        setTimeout(() => {
          window.Telegram.WebApp.openLink(wbWebLink)
        }, 1000)
      } catch (error) {
        console.error('Error opening Wildberries:', error)
        // Fallback на веб-версию
        window.Telegram.WebApp.openLink(wbWebLink)
      }
    } else {
      // В обычном браузере открываем веб-версию
      window.open(wbWebLink, '_blank')
    }
  }

  const openOzon = (products: CartItem[]) => {
    const ozonIds = products.map(item => item.product.marketplace_id).join(',')
    
    // Deep link для приложения Ozon
    const ozonAppLink = `ozon://products?ids=${ozonIds}`
    
    // Fallback web ссылка для браузера
    const ozonWebLink = products.length === 1 
      ? `https://www.ozon.ru/product/${products[0].product.marketplace_id}/`
      : `https://www.ozon.ru/search/?text=${ozonIds}`
    
    console.log('Opening Ozon with products:', { ozonIds, ozonAppLink, ozonWebLink })
    
    if (window.Telegram?.WebApp) {
      // В Telegram WebApp пытаемся открыть приложение Ozon
      try {
        // Сначала пытаемся открыть приложение
        window.open(ozonAppLink, '_blank')
        
        // Если не получилось, через секунду открываем веб-версию
        setTimeout(() => {
          if (window.Telegram?.WebApp?.openLink) {
            window.Telegram.WebApp.openLink(ozonWebLink)
          } else {
            window.open(ozonWebLink, '_blank')
          }
        }, 1000)
      } catch (error) {
        console.error('Error opening Ozon:', error)
        // Fallback на веб-версию
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(ozonWebLink)
        } else {
          window.open(ozonWebLink, '_blank')
        }
      }
    } else {
      // В обычном браузере открываем веб-версию
      window.open(ozonWebLink, '_blank')
    }
  }

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product)
    setCurrentView('product-detail')
    loadProductReviews(product)
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    // Фильтр по поиску
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Фильтр по категории/маркетплейсу
    let matchesCategory = true
    if (selectedCategory === 'wildberries') {
      matchesCategory = product.marketplace === 'wildberries'
    } else if (selectedCategory === 'ozon') {
      matchesCategory = product.marketplace === 'ozon'
    } else if (selectedCategory !== 'all') {
      matchesCategory = product.category === selectedCategory
    }
    
    return matchesSearch && matchesCategory
  })

  // Получаем уникальные категории и маркетплейсы
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))]
  const marketplaces = [...new Set(products.map(p => p.marketplace).filter(Boolean))]
  
  // Отладочная информация
  console.log('MiniApp Debug:', {
    totalProducts: products.length,
    marketplaces,
    categories,
    selectedCategory,
    filteredProductsCount: filteredProducts.length,
    productsWithMarketplace: products.filter(p => p.marketplace).length,
    sampleProducts: products.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      marketplace: p.marketplace,
      category: p.category
    }))
  })

  const getMarketplaceBadge = (marketplace: string) => {
    return marketplace === 'wildberries' ? (
      <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
        WB
      </div>
    ) : marketplace === 'ozon' ? (
      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
        Ozon
      </div>
    ) : null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Магазин не найден</h2>
          <p className="text-gray-600">Проверьте правильность ссылки</p>
        </div>
      </div>
    )
  }

  // Детальная страница товара
  if (currentView === 'product-detail' && selectedProduct) {
    const avgRating = productReviews.length > 0 
      ? productReviews.reduce((sum, review) => sum + review.productValuation, 0) / productReviews.length 
      : selectedProduct.rating || 0

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Заголовок */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setCurrentView('catalog')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-bold text-gray-900">Товар</h1>
              </div>
              <div className="relative">
                <Button 
                  size="sm" 
                  className="relative"
                  onClick={() => setCurrentView('cart')}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Изображения товара */}
          <div className="bg-white rounded-lg overflow-hidden">
            {selectedProduct.images && selectedProduct.images.length > 0 ? (
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.name}
                className="w-full h-80 object-cover"
              />
            ) : (
              <div className="w-full h-80 bg-gray-200 flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Информация о товаре */}
          <div className="bg-white rounded-lg p-4 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {selectedProduct.name}
              </h2>
              {selectedProduct.brand && (
                <p className="text-sm text-gray-600 mb-2">{selectedProduct.brand}</p>
              )}
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  {renderStars(Math.round(avgRating), 'md')}
                  <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {productReviews.length} отзывов
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {selectedProduct.properties?.originalPrice && selectedProduct.properties.originalPrice > selectedProduct.price ? (
                  <>
                    <div className="text-sm text-gray-500 line-through">
                      {formatPrice(selectedProduct.properties.originalPrice)}
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatPrice(selectedProduct.price)}
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      -{Math.round((1 - selectedProduct.price / selectedProduct.properties.originalPrice) * 100)}%
                    </Badge>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(selectedProduct.price)}
                  </div>
                )}
              </div>
            </div>

            {selectedProduct.description && (
              <div>
                <h3 className="font-semibold mb-2">Описание</h3>
                <p className="text-gray-700 text-sm">{selectedProduct.description}</p>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex space-x-3 pt-4">
              {cart.find(item => item.product.id === selectedProduct.id) ? (
                <div className="flex items-center space-x-3 flex-1">
                  <Button
                    variant="outline"
                    onClick={() => removeFromCart(selectedProduct.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-lg">
                    {cart.find(item => item.product.id === selectedProduct.id)?.quantity || 0}
                  </span>
                  <Button
                    onClick={() => addToCart(selectedProduct)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="flex-1"
                  onClick={() => addToCart(selectedProduct)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  В корзину
                </Button>
              )}
              <Button variant="outline">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Отзывы */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Отзывы ({productReviews.length})</h3>
              <div className="flex items-center space-x-2">
                {renderStars(Math.round(avgRating), 'sm')}
                <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {productReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{review.userName}</p>
                          <div className="flex items-center space-x-2">
                            {renderStars(review.productValuation, 'sm')}
                            <span className="text-xs text-gray-500">
                              {new Date(review.createdDate).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.matchingSize === 'small' && (
                        <Badge variant="outline" className="text-xs">Маломерит</Badge>
                      )}
                      {review.matchingSize === 'big' && (
                        <Badge variant="outline" className="text-xs">Большемерит</Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{review.text}</p>

                    {(review.pros || review.cons) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        {review.pros && (
                          <div className="flex items-start space-x-2">
                            <ThumbsUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-green-800">Достоинства</p>
                              <p className="text-xs text-gray-700">{review.pros}</p>
                            </div>
                          </div>
                        )}
                        {review.cons && (
                          <div className="flex items-start space-x-2">
                            <ThumbsDown className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-red-800">Недостатки</p>
                              <p className="text-xs text-gray-700">{review.cons}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {review.photoLinks && review.photoLinks.length > 0 && (
                      <div className="flex space-x-2 mb-3">
                        {review.photoLinks.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt="Фото отзыва"
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    {review.answer && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-800">Ответ продавца</span>
                          <span className="text-xs text-gray-500">
                            {new Date(review.answer.createdDate).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700">{review.answer.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Корзина
  if (currentView === 'cart') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Заголовок корзины */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setCurrentView('catalog')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Корзина</h1>
              </div>
              <div className="text-sm text-gray-600">
                {getTotalItems()} товар(ов)
              </div>
            </div>
          </div>
        </div>

        {/* Содержимое корзины */}
        <div className="p-4">
          {cart.length > 0 ? (
            <div className="space-y-4">
              {cart.map((item) => (
                <Card key={item.product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 flex-shrink-0">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {item.product.name}
                        </h3>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatPrice(item.product.price)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => addToCart(item.product)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Итого */}
              <div className="bg-white rounded-lg p-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Итого:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                  onClick={handleCheckout}
                >
                  🛒 Перейти к покупке
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Корзина пуста</h3>
              <p className="text-gray-600">Добавьте товары из каталога</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Профиль
  if (currentView === 'profile') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Профиль</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Профиль</h3>
            <p className="text-gray-600">Информация о пользователе</p>
          </div>
        </div>
      </div>
    )
  }

  // Каталог (главная страница)
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
              {store.description && (
                <p className="text-sm text-gray-600">{store.description}</p>
              )}
            </div>
            <div className="relative">
              <Button 
                size="sm" 
                className="relative"
                onClick={() => setCurrentView('cart')}
              >
                <ShoppingCart className="h-4 w-4" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Поиск */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Категории */}
          <div className="flex space-x-2 overflow-x-auto">
            {marketplaces.length > 1 && (
              <>
                {marketplaces.map((marketplace) => (
                  <Button
                    key={marketplace}
                    size="sm"
                    variant={selectedCategory === marketplace ? "default" : "outline"}
                    onClick={() => setSelectedCategory(marketplace)}
                    className={`whitespace-nowrap ${
                      marketplace === 'wildberries' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      marketplace === 'ozon' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''
                    }`}
                  >
                    {marketplace === 'wildberries' ? '🟣 Wildberries' : 
                     marketplace === 'ozon' ? '🔵 Ozon' : marketplace}
                  </Button>
                ))}
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
              </>
            )}
            {categories.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category === 'all' ? 'Все' : category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Список товаров */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openProductDetail(product)}
            >
              <div className="relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Нет+изображения'
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <span className="text-gray-400">Нет изображения</span>
                  </div>
                )}
                {getMarketplaceBadge(product.marketplace)}
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Добавить в избранное
                  }}
                >
                  <Heart className="h-4 w-4" />
                </Button>
                {product.properties?.originalPrice && product.properties.originalPrice > product.price && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    -{Math.round((1 - product.price / product.properties.originalPrice) * 100)}%
                  </div>
                )}
              </div>
              
              <CardContent className="p-3">
                <div className="space-y-2">
                  <h3 className="font-semibold line-clamp-2 text-sm">
                    {product.name}
                  </h3>
                  
                  {product.brand && (
                    <p className="text-xs text-gray-500">{product.brand}</p>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    {product.rating > 0 && (
                      <div className="flex items-center space-x-1">
                        {renderStars(product.rating, 'sm')}
                        <span className="text-xs text-gray-600">
                          {product.rating} ({product.reviews_count})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {product.properties?.originalPrice && product.properties.originalPrice > product.price ? (
                        <>
                          <div className="text-xs text-gray-500 line-through">
                            {formatPrice(product.properties.originalPrice)}
                          </div>
                          <div className="text-lg font-bold text-red-600">
                            {formatPrice(product.price)}
                          </div>
                        </>
                      ) : (
                        <div className="text-lg font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart(product)
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Товары не найдены</h3>
            <p className="text-gray-600">Попробуйте изменить поисковый запрос</p>
          </div>
        )}
      </div>

      {/* Нижнее меню */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-3 h-16">
          <button
            onClick={() => setCurrentView('catalog')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              currentView === 'catalog' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Главная</span>
          </button>
          
          <button
            onClick={() => setCurrentView('cart')}
            className={`flex flex-col items-center justify-center space-y-1 relative ${
              currentView === 'cart' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs">Корзина</span>
            {getTotalItems() > 0 && (
              <span className="absolute top-1 right-6 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              currentView === 'profile' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Профиль</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Типы для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        sendData: (data: string) => void
        close: () => void
        ready: () => void
        expand: () => void
        openLink: (url: string) => void
      }
    }
  }
}
