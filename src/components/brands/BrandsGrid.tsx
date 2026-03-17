// components/brands/BrandsGrid.tsx
import { useBrands } from '@/hooks/useBrands';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function BrandsGrid() {
  const { brands, loading } = useBrands();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {brands.map((brand) => (
        <Link
          key={brand.id}
          to={`/brands/${brand.slug}`}
          className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
        >
          <div className="aspect-square p-6 bg-gradient-to-br from-gold/5 to-gold/10">
            <img
              src={brand.logo}
              alt={brand.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x200/333333/ffffff?text=${brand.name.charAt(0)}`;
              }}
            />
          </div>
          <div className="p-4 text-center">
            <h3 className="font-semibold text-lg">{brand.name}</h3>
            <p className="text-sm text-gray-600">{brand.productCount} Products</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
