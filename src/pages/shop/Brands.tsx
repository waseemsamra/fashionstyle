import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { API_CONFIG } from '../../config/api';
const PRODUCTS_API_URL = API_CONFIG.productsApi;

interface Brand {
  id: string;
  name: string;
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
      // Fetch all products to get all brands
      let allProducts: any[] = [];
      let page = 1;
      const pageSize = 1000; // Increased from 500 to 1000
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(`${PRODUCTS_API_URL}?limit=${pageSize}&page=${page}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        console.log(`API Response structure:`, Object.keys(data));
        console.log(`Full API Response:`, data);
        
        const products = data.products || data.items || [];
        console.log(`Products array length: ${products.length}`);
        console.log(`Sample product:`, products[0]);
        
        if (products.length === 0) {
          hasMore = false;
        } else {
          allProducts = [...allProducts, ...products];
          console.log(`Fetched page ${page}: ${products.length} products (total: ${allProducts.length})`);
          page++;
          
          // Increased safety limit to allow more pages
          if (page > 100) hasMore = false;
        }
      }
      
      console.log(`Total products fetched: ${allProducts.length}`);
      
      // Extract unique brands from products
      const brandMap = new Map<string, Brand>();
      let productsWithoutBrand = 0;
      let invalidBrandTypes = 0;
      
      console.log(`Processing ${allProducts.length} products for brand extraction...`);
      
      allProducts.forEach((product: any, index: number) => {
        // Log first few products to understand structure
        if (index < 5) {
          console.log(`Product ${index}:`, product);
        }
        
        if (product.brand) {
          if (typeof product.brand === 'string' && product.brand.trim()) {
            const brandName = product.brand.trim();
            if (!brandMap.has(brandName)) {
              brandMap.set(brandName, {
                id: brandName.toLowerCase().replace(/\s+/g, '-'),
                name: brandName,
                active: true,
                products: 0
              });
            }
            const brand = brandMap.get(brandName);
            if (brand) {
              brand.products = (brand.products || 0) + 1;
            }
          } else {
            invalidBrandTypes++;
            console.log(`Invalid brand type for product ${index}:`, typeof product.brand, product.brand);
          }
        } else {
          productsWithoutBrand++;
        }
      });
      
      const brandsData = Array.from(brandMap.values());
      console.log(`=== BRAND EXTRACTION SUMMARY ===`);
      console.log(`Total products processed: ${allProducts.length}`);
      console.log(`Products without brand: ${productsWithoutBrand}`);
      console.log(`Products with invalid brand type: ${invalidBrandTypes}`);
      console.log(`Unique brands extracted: ${brandsData.length}`);
      console.log(`Sample brands:`, brandsData.slice(0, 10).map(b => b.name));
      console.log(`================================`);
      
      setBrands(brandsData);
    } catch (error) {
      console.error('❌ Failed to load brands:', error);
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

  const carouselBrands = sortedBrands.slice(0, 20);
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
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-8">Brands</h1>

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

