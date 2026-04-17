// components/brands/BrandsGrid.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { API_CONFIG } from '../../config/api';
const BRANDS_API_URL = API_CONFIG.brandsApi;

interface Brand {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  products?: number;
}

export function BrandsGrid() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await fetch(BRANDS_API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const brandsData = data.brands || data.items || [];
      setBrands(brandsData);
    } catch (error) {
      console.error('❌ Failed to load brands:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No brands available</p>
      </div>
    );
  }

  // Sort alphabetically
  const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {sortedBrands.map((brand) => (
        <Link
          key={brand.id}
          to={`/brand/${encodeURIComponent(brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))}`}
          className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg border border-gray-100 hover:border-gold/30 transition-all duration-300 overflow-hidden"
        >
          <div className="p-5 flex flex-col items-center justify-center min-h-[100px]">
            <h3 className="font-medium text-sm text-center text-gray-800 group-hover:text-gold transition-colors duration-300 leading-tight">
              {brand.name}
            </h3>
            {brand.description && (
              <p className="text-xs text-gray-400 mt-2 text-center line-clamp-2">
                {brand.description}
              </p>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
        </Link>
      ))}
    </div>
  );
}

