import { useBrands } from '@/hooks/useBrands';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface BrandsGridProps {
  featured?: boolean;
  limit?: number;
}

export function BrandsGrid({ featured = false, limit = 10 }: BrandsGridProps) {
  const { data: brands, isLoading, isError, error } = useBrands({ featured, limit });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error?.message || 'Failed to load brands'}</p>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No brands found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {brands.map((brand) => (
        <Link
          key={brand.id}
          to={`/brands/${brand.slug}`}
          className="group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
        >
          <div className="aspect-square p-6 bg-gradient-to-br from-gold/5 to-gold/10">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-full h-full object-contain group-hover:scale-105 transition"
                onError={(e) => {
                  // Fallback if logo doesn't exist
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Brand';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gold">{brand.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="p-4 text-center">
            <h3 className="font-semibold text-lg mb-1">{brand.name}</h3>
            <p className="text-sm text-gray-600">{brand.productCount} Products</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
