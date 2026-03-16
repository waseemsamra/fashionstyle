import { useBrands } from '@/hooks/useBrands';
import { Link } from 'react-router-dom';
import { Loader2, Store, MapPin, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LazyImage from '@/components/ui/LazyImage';
import { useState } from 'react';

export default function BrandsPage() {
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const { data: brands, isLoading, error } = useBrands({
    featured: showFeaturedOnly ? true : undefined
  });

  console.log('📊 Brands state:', { brands, isLoading, error, count: brands?.length });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
          <p className="text-gray-600">Loading brands...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Brands error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Failed to load brands</h2>
          <p className="text-gray-600 mb-4">Please try again later</p>
          <Button onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Brands</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover premium fashion from the world's most celebrated brands, 
            each chosen for their exceptional quality and unique style.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-center mb-8">
          <Button
            variant={showFeaturedOnly ? 'default' : 'outline'}
            onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
            className="gap-2"
          >
            <Star className="w-4 h-4" />
            {showFeaturedOnly ? 'Show All Brands' : 'Featured Only'}
          </Button>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-600">
          {brands?.length || 0} {brands?.length === 1 ? 'brand' : 'brands'} 
          {showFeaturedOnly && ' (Featured)'}
        </div>

        {/* Brands Grid */}
        {brands && brands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                to={`/brands/${brand.slug}`}
                className="group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  <LazyImage
                    src={brand.coverImage}
                    alt={brand.name}
                    productName={brand.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  
                  {/* Featured Badge */}
                  {brand.isFeatured && (
                    <Badge className="absolute top-3 right-3 bg-gold text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  
                  {/* Logo Overlay */}
                  <div className="absolute -bottom-8 left-6">
                    <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                      <LazyImage
                        src={brand.logo}
                        alt={`${brand.name} logo`}
                        productName={brand.name}
                        className="w-full h-full object-cover p-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-12 p-6">
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-gold transition">
                    {brand.name}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {brand.shortDescription}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {brand.establishedYear && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Est. {brand.establishedYear}</span>
                      </div>
                    )}
                    
                    {brand.country && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{brand.country}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Store className="w-4 h-4" />
                      <span>{brand.productCount}+ Products</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No brands found</h3>
            <p className="text-gray-600 mb-4">
              {showFeaturedOnly 
                ? 'No featured brands available' 
                : 'Check back soon for new brands'}
            </p>
            {showFeaturedOnly && (
              <Button onClick={() => setShowFeaturedOnly(false)}>
                Show All Brands
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
