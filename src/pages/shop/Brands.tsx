import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { API_CONFIG } from '../../config/api';
const BRANDS_API_URL = API_CONFIG.brandsApi;

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  active?: boolean;
  products?: number;
}

const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      console.log('Fetching brands from dedicated brands API...');
      console.log('🌐 Using BRANDS_API_URL:', BRANDS_API_URL);
      
      const response = await fetch(`${BRANDS_API_URL}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      console.log(`=== API RESPONSE DEBUG ===`);
      console.log(`API Response structure:`, Object.keys(data));
      console.log(`API Response keys and types:`, Object.keys(data).map(key => `${key}: ${typeof data[key]} (${Array.isArray(data[key]) ? 'array' : 'not array'})`));
      console.log(`data.count:`, data.count);
      console.log(`data.brands:`, data.brands);
      console.log(`data.items:`, data.items);
      console.log(`Full API Response:`, data);
      
      // Use brands API response directly - API returns array of brands directly
      const brands = Array.isArray(data) ? data : (data.brands || data.items || data.data || []);
      console.log(`=== BRAND FETCH SUMMARY ===`);
      console.log(`API Response structure:`, Object.keys(data));
      console.log(`data.count:`, data.count);
      console.log(`data.brands length:`, data.brands?.length || 0);
      console.log(`Selected brands array length: ${brands.length}`);
      console.log(`Sample brand:`, brands[0]);
      console.log(`Sample brand keys:`, brands[0] ? Object.keys(brands[0]) : 'No brand data');
      console.log(`========================`);
      
      // Use brands API response directly - API returns array of strings (brand names)
      const brandsData = brands.map((brand: any, index: number) => {
        console.log(`Processing brand:`, brand);
        const brandName = typeof brand === 'string' ? brand : (brand.name || brand.brand || brand.title || 'Unknown Brand');
        // Create unique ID using index to avoid duplicates from case variations
        const baseId = brandName.toLowerCase().replace(/\s+/g, '-');
        const uniqueId = `${baseId}-${index}`;
        const createSlug = (name: string) =>
          name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        return {
          id: uniqueId,
          name: brandName,
          slug: createSlug(brandName),
          active: true,
          products: 0
        };
      });
      
      console.log(`Final brands data length: ${brandsData.length}`);
      setBrands(brandsData);
    } catch (error) {
      console.warn('Brands API failed due to CORS, using products API fallback:', error);
      
      // Fallback to products API with improved brand extraction
      console.log('Fetching brands from products API as fallback...');
      try {
        const response = await fetch(`${API_CONFIG.productsApi}/products?limit=2000`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        const products = data.products || data.items || [];
        console.log(`Products array length: ${products.length}`);
        
        // Extract unique brands from products with improved logic
        const brandMap = new Map<string, Brand>();
        products.forEach((product: any, index: number) => {
          if (product.brand && typeof product.brand === 'string' && product.brand.trim()) {
            const brandName = product.brand.trim();
            if (!brandMap.has(brandName)) {
              // Create unique ID using index to avoid duplicates
              const baseId = brandName.toLowerCase().replace(/\s+/g, '-');
              const uniqueId = `${baseId}-${index}`;
              const createSlug = (name: string) =>
                name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              brandMap.set(brandName, {
                id: uniqueId,
                name: brandName,
                slug: createSlug(brandName),
                active: true,
                products: 0
              });
            }
          }
        });
        
        const brandsData = Array.from(brandMap.values());
        console.log(`=== FALLBACK BRAND FETCH SUMMARY ===`);
        console.log(`Products processed: ${products.length}`);
        console.log(`Unique brands extracted: ${brandsData.length}`);
        console.log(`Sample brands:`, brandsData.slice(0, 10).map(b => b.name));
        console.log(`==================================`);
        
        setBrands(brandsData);
      } catch (fallbackError) {
        console.error('Products API fallback also failed:', fallbackError);
        setBrands([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => a.name.localeCompare(b.name));
  }, [brands]);

  const filteredBrands = useMemo(() => {
    let filtered = sortedBrands;

    if (searchTerm) {
      filtered = filtered.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedLetter !== 'ALL' && !searchTerm) {
      filtered = filtered.filter(b => b.name.charAt(0).toUpperCase() === selectedLetter);
    }

    return filtered;
  }, [sortedBrands, selectedLetter, searchTerm]);

  const groupedBrands = useMemo(() => {
    const groups: Record<string, Brand[]> = {};
    filteredBrands.forEach(brand => {
      const letter = brand.name.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(brand);
    });
    return groups;
  }, [filteredBrands]);

  const carouselBrands = sortedBrands;
  const visibleBrands = 4;
  const maxIndex = Math.max(0, carouselBrands.length - visibleBrands);

  const scrollCarousel = (dir: 'left' | 'right') => {
    setCarouselIndex(prev => {
      if (dir === 'left') return Math.max(0, prev - 1);
      return Math.min(maxIndex, prev + 1);
    });
  };

  const createSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  if (loading) {
    console.log('Brands page is in loading state');
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading brands...</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('Brands page rendering - brands.length:', brands.length, 'loading:', loading);
  
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-8">Brands</h1>
        
        {/* Debug Info */}
        <div className="text-center mb-4 text-sm text-gray-600">
          Debug: {brands.length} brands loaded, Loading: {loading ? 'Yes' : 'No'}
        </div>

        {/* Brand Logos Carousel */}
        {carouselBrands.length > 0 && (
          <div className="relative mb-8">
            <button
              onClick={() => scrollCarousel('left')}
              disabled={carouselIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-600 text-white p-2 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="overflow-hidden mx-8">
              <div className="flex gap-4 transition-transform duration-300" style={{ transform: `translateX(-${carouselIndex * (100 / visibleBrands)}%)` }}>
                {carouselBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    to={`/brand/${createSlug(brand.name)}`}
                    className="flex-shrink-0 w-1/4 border border-gray-200 rounded-lg p-6 flex items-center justify-center bg-white hover:border-gold/30 transition"
                  >
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="max-h-16 w-auto object-contain" />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">{brand.name}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
            <button
              onClick={() => scrollCarousel('right')}
              disabled={carouselIndex >= maxIndex}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-600 text-white p-2 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="max-w-md mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a brand..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value) setSelectedLetter('ALL');
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gold/50"
            />
          </div>
        </div>

        {/* Alphabet Filter */}
        <div className="flex flex-wrap justify-center gap-1 mb-10">
          {ALPHABET.map(letter => (
            <button
              key={letter}
              onClick={() => {
                setSelectedLetter(letter);
                setSearchTerm('');
              }}
              className={`min-w-[36px] h-9 px-2 text-sm font-medium rounded-sm transition ${
                selectedLetter === letter
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Brands Grouped by Letter */}
        {filteredBrands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No brands found</p>
          </div>
        ) : (
          Object.entries(groupedBrands).map(([letter, letterBrands]) => (
            <div key={letter} className="mb-10">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-200">{letter}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3">
                {letterBrands.map(brand => (
                  <Link
                    key={brand.id}
                    to={`/brand/${createSlug(brand.name)}`}
                    className="text-sm text-gray-700 hover:text-gold transition-colors py-1"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

