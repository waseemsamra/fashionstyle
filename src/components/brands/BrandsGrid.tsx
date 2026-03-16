import { useBrands, useFeaturedBrands } from '@/hooks/useBrands';
import { Link } from 'react-router-dom';
import { Loader2, Search, Star } from 'lucide-react';
import { useState } from 'react';
import type { Brand } from '@/hooks/useBrands';

interface BrandsGridProps {
  featured?: boolean;
  limit?: number;
  showSearch?: boolean;
}

export function BrandsGrid({ featured = false, limit = 20, showSearch = false }: BrandsGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { brands, isLoading, isError } = featured 
    ? useFeaturedBrands(limit)
    : useBrands({ search: searchTerm || undefined });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load brands. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      {showSearch && (
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
      )}

      {brands.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm ? `No brands found matching "${searchTerm}"` : 'No brands found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link
      to={`/brands/${brand.slug}`}
      className="group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
    >
      <div className="aspect-square p-6 bg-gradient-to-br from-gold/5 to-gold/10 relative">
        <img
          src={brand.logo}
          alt={brand.name}
          className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
          onError={(e) => {
            // Fallback if logo doesn't exist
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x200/333333/ffffff?text=${brand.name.charAt(0)}`;
          }}
        />
        {brand.isFeatured && (
          <div className="absolute top-2 right-2 bg-gold text-white p-1 rounded-full">
            <Star className="w-4 h-4 fill-current" />
          </div>
        )}
      </div>
      <div className="p-4 text-center">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{brand.name}</h3>
        <p className="text-sm text-gray-600">{brand.productCount} Product{brand.productCount !== 1 ? 's' : ''}</p>
        
        {/* Product preview images */}
        {brand.products && brand.products.length > 0 && (
          <div className="flex justify-center -space-x-2 mt-3">
            {brand.products.slice(0, 3).map((product, idx) => (
              <img
                key={idx}
                src={product.image}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ))}
            {brand.productCount > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                +{brand.productCount - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
