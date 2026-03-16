import { useParams, useNavigate } from 'react-router-dom';
import { useBrand, useBrandProducts, useBrandCollections } from '@/hooks/useBrands';
import { useState } from 'react';
import { Loader2, Package, Award, Globe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import LazyImage from '@/components/ui/LazyImage';
import { getProductUrl } from '@/utils/productUrl';

export default function BrandDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>(undefined);
  
  // These three queries run in parallel and are cached
  const { data: brand, isLoading: brandLoading, error: brandError } = useBrand(slug!);
  const { data: collections, isLoading: collectionsLoading } = useBrandCollections(brand?.id!);
  const {
    data: productsData,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useBrandProducts(brand?.id!, { category: selectedCollection });

  if (brandLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
          <p className="text-gray-600">Loading brand...</p>
        </div>
      </div>
    );
  }

  if (brandError || !brand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Brand not found</h2>
          <p className="text-gray-600 mb-4">This brand may have been removed or doesn't exist</p>
          <Button onClick={() => navigate('/brands')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            View all brands
          </Button>
        </div>
      </div>
    );
  }

  const allProducts = (productsData as any)?.pages?.flatMap((page: any) => page.products) || [];

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Hero Section */}
      <div className="relative h-64 md:h-96">
        <LazyImage
          src={brand.coverImage}
          alt={brand.name}
          productName={brand.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/brands')}
          className="absolute top-4 left-4 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Brands
        </Button>
        
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden flex-shrink-0">
                <LazyImage
                  src={brand.logo}
                  alt={brand.name}
                  productName={brand.name}
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <div className="text-white flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-5xl font-bold">{brand.name}</h1>
                  {brand.isFeatured && (
                    <Badge className="bg-gold text-white">
                      <Award className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <p className="text-lg md:text-xl opacity-90 max-w-2xl mb-4">
                  {brand.shortDescription}
                </p>
                
                {/* Brand Stats */}
                <div className="flex flex-wrap gap-4 md:gap-6 text-sm md:text-base">
                  {brand.establishedYear && (
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      <span>Since {brand.establishedYear}</span>
                    </div>
                  )}
                  {brand.country && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      <span>{brand.country}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    <span>{brand.productCount} Products</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="products" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="collections" className="gap-2">
              <Award className="w-4 h-4" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Globe className="w-4 h-4" />
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {/* Collection Filter */}
            {!collectionsLoading && collections && collections.length > 0 && (
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Filter by Collection</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedCollection === undefined ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCollection(undefined)}
                      className={selectedCollection === undefined ? 'bg-gold hover:bg-gold/90' : ''}
                    >
                      All Products
                    </Button>
                    {collections.map((collection) => (
                      <Button
                        key={collection.id}
                        variant={selectedCollection === collection.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCollection(collection.id)}
                        className={selectedCollection === collection.id ? 'bg-gold hover:bg-gold/90' : ''}
                      >
                        {collection.name}
                        <span className="ml-1 text-xs opacity-75">
                          ({collection.productCount})
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-gray-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : allProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {allProducts.map((product: any) => (
                    <Card
                      key={product.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(getProductUrl(product))}
                    >
                      <div className="aspect-square relative">
                        <LazyImage
                          src={product.image}
                          alt={product.name}
                          productName={product.name}
                          productId={product.id}
                          className="w-full h-full object-cover"
                        />
                        {product.isNew && (
                          <Badge className="absolute top-2 left-2 bg-green-500">
                            New
                          </Badge>
                        )}
                        {product.isSale && (
                          <Badge className="absolute top-2 left-2 bg-red-500">
                            Sale
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gold">
                            ${product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Load More */}
                {hasNextPage && (
                  <div className="text-center mt-8">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="bg-gold hover:bg-gold/90"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More Products'
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-gray-600">
                  {selectedCollection 
                    ? 'Try selecting a different collection' 
                    : 'Check back soon for new arrivals'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collections">
            {collectionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gray-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : collections && collections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <Card
                    key={collection.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="aspect-video relative">
                      <LazyImage
                        src={collection.image}
                        alt={collection.name}
                        productName={collection.name}
                        className="w-full h-full object-cover"
                      />
                      {collection.isSeasonal && (
                        <Badge className="absolute top-2 right-2 bg-purple-500">
                          {collection.season} {collection.year}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{collection.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {collection.productCount} products
                        </span>
                        <Button size="sm" variant="outline">
                          View Collection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
                <p className="text-gray-600">Check back soon for new collections</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about">
            <Card className="max-w-3xl mx-auto">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-4">About {brand.name}</h2>
                <p className="text-gray-700 whitespace-pre-line mb-8">
                  {brand.description}
                </p>
                
                {/* Additional brand info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  {brand.establishedYear && (
                    <div>
                      <h3 className="font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Established
                      </h3>
                      <p className="text-lg">{brand.establishedYear}</p>
                    </div>
                  )}
                  {brand.country && (
                    <div>
                      <h3 className="font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Country of Origin
                      </h3>
                      <p className="text-lg">{brand.country}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-600 mb-2 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Total Products
                    </h3>
                    <p className="text-lg">{brand.productCount}</p>
                  </div>
                  {collections && collections.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Collections
                      </h3>
                      <p className="text-lg">{collections.length}</p>
                    </div>
                  )}
                </div>

                {/* SEO Info */}
                {brand.seo?.keywords && brand.seo.keywords.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-semibold text-gray-600 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {brand.seo.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
