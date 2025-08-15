import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Package, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Star,
  ShoppingCart,
  RefreshCw,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { supabase, Product, auth } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStore, setSelectedStore] = useState('all')
  const [selectedMarketplace, setSelectedMarketplace] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [stores, setStores] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const user = await auth.getCurrentUser()
      if (!user) {
        setProducts([])
        setStores([])
        return
      }

      // Загружаем магазины пользователя
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('owner_id', user.id)
        .eq('status', 'active')

      if (storesError) {
        console.error('Error loading stores:', storesError)
        setStores([])
        setProducts([])
        return
      }
      setStores(storesData || [])

      // Загружаем товары
      const storeIds = storesData?.map(s => s.id) || []
      if (storeIds.length === 0) {
        setProducts([])
        return
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          stores (
            name
          )
        `)
        .in('store_id', storeIds)
        .order('created_at', { ascending: false })

      if (productsError) {
        console.error('Error loading products:', productsError)
        setProducts([])
        return
      }
      setProducts(productsData || [])
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
      setStores([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesStore = selectedStore === 'all' || product.store_id === selectedStore
    const matchesMarketplace = selectedMarketplace === 'all' || product.marketplace === selectedMarketplace
    return matchesSearch && matchesCategory && matchesStore && matchesMarketplace
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'price':
        aValue = a.price
        bValue = b.price
        break
      case 'created_at':
        aValue = new Date(a.created_at)
        bValue = new Date(b.created_at)
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

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))]
  const marketplaces = ['all', ...new Set(products.map(p => p.marketplace).filter(Boolean))]

  const getMarketplaceBadge = (marketplace: string) => {
    return marketplace === 'wildberries' ? (
      <Badge className="bg-purple-100 text-purple-800">WB</Badge>
    ) : marketplace === 'ozon' ? (
      <Badge className="bg-blue-100 text-blue-800">Ozon</Badge>
    ) : (
      <Badge variant="outline">Неизвестно</Badge>
    )
  }

  const getStockBadge = (inStock: boolean) => {
    return inStock ? (
      <Badge className="bg-green-100 text-green-800">В наличии</Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-200">Нет в наличии</Badge>
    )
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="hover:shadow-lg transition-shadow">
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
          <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          {getStockBadge(product.in_stock)}
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold line-clamp-2 text-sm mb-1">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-xs text-gray-500">{product.brand}</p>
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
            {product.rating > 0 && (
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">
                  {product.rating} ({product.reviews_count})
                </span>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">
            {product.marketplace === 'wildberries' ? 'WB ID' : 'Ozon ID'}: {product.marketplace_id || product.wb_id}
          </div>
          
          <div className="flex items-center justify-between">
            {getMarketplaceBadge(product.marketplace)}
          </div>

          <div className="flex space-x-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Eye className="h-3 w-3 mr-1" />
              Просмотр
            </Button>
            <Button size="sm" variant="outline">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ProductRow = ({ product }: { product: Product }) => (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 flex-shrink-0">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/64x64?text=Нет+фото'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {product.name}
              </h3>
              <div className="flex items-center space-x-4 mt-1">
                {product.brand && (
                  <span className="text-sm text-gray-500">{product.brand}</span>
                )}
                <span className="text-sm text-gray-500">
                  {product.marketplace === 'wildberries' ? 'WB ID' : 'Ozon ID'}: {product.marketplace_id || product.wb_id}
                </span>
                {product.category && (
                  <span className="text-sm text-gray-500">{product.category}</span>
                )}
                {getMarketplaceBadge(product.marketplace)}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {formatPrice(product.price)}
                </div>
                {product.rating > 0 && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600">
                      {product.rating} ({product.reviews_count})
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {getStockBadge(product.in_stock)}
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Просмотр
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Товары</h1>
          <p className="text-gray-600 mt-1">
            Управление каталогом товаров ({products.length} товаров)
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все магазины</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все категории</option>
              {categories.slice(1).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            
            <select
              value={selectedMarketplace}
              onChange={(e) => setSelectedMarketplace(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все маркетплейсы</option>
              {marketplaces.slice(1).map((marketplace) => (
                <option key={marketplace} value={marketplace}>
                  {marketplace === 'wildberries' ? 'Wildberries' : marketplace === 'ozon' ? 'Ozon' : marketplace}
                </option>
              ))}
            </select>
            
            <div className="flex space-x-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field as any)
                  setSortOrder(order as any)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at-desc">Новые первые</option>
                <option value="created_at-asc">Старые первые</option>
                <option value="name-asc">По названию А-Я</option>
                <option value="name-desc">По названию Я-А</option>
                <option value="price-asc">Дешевые первые</option>
                <option value="price-desc">Дорогие первые</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Найдено: {sortedProducts.length} товаров
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список товаров */}
      {sortedProducts.length > 0 ? (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        )}>
          {sortedProducts.map((product) => (
            viewMode === 'grid' ? (
              <ProductCard key={product.id} product={product} />
            ) : (
              <ProductRow key={product.id} product={product} />
            )
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            {products.length === 0 ? (
              <>
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Нет товаров
                </h3>
                <p className="text-gray-600 mb-4">
                  Товары появятся после синхронизации с Wildberries
                </p>
                <p className="text-sm text-gray-500">
                  Перейдите в раздел "Магазины" и нажмите "Синхронизация" для загрузки товаров
                </p>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Товары не найдены
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
  )
}