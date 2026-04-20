import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Star, ChevronLeft, ChevronRight, ChevronDown, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { getProductUrl } from '@/utils/productUrl';
import { toCDNUrl } from '@/utils/productImage';
import LazyImage from '@/components/ui/LazyImage';
import { useBrands } from '@/hooks/useBrands';
import type { Brand } from '@/services/brandsService';

import { API_CONFIG } from '../../config/api';
const API_URL = API_CONFIG.productsApi;
const PRODUCTS_PER_PAGE = 100;

export default function DesignersDiscount() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [apiTotal, setApiTotal] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    brands: [] as string[],
    priceRange: 'all' as 'all' | '0-5000' | '5000-10000' | '10000-20000' | '20000+',
    sortBy: 'createdAt' as 'createdAt' | 'price' | 'name' | 'rating',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const { brands: allBrands } = useBrands();

  // Extract brands from products as fallback
  const extractBrandsFromProducts = (products: any[]) => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return uniqueBrands.sort();
  };
  
  // Use brands from API, or fallback to extracting from products
  const apiBrands = (allBrands?.map((b: Brand) => b.name).filter(Boolean) || []);
  const productBrands = allProducts.length > 0 ? extractBrandsFromProducts(allProducts) : [];
  const brands = apiBrands.length > 0 ? apiBrands : productBrands;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false);
      }
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target as Node)) {
        setShowPriceDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setIsLoadingProducts(true);
      
      const params = new URLSearchParams();
      
      // Always fetch more products to get accurate total count
      const fetchLimit = filters.brands.length > 0 || filters.priceRange !== 'all' ? 500 : PRODUCTS_PER_PAGE;
      params.append('limit', String(fetchLimit));
      params.append('page', String(currentPage));
      params.append('collection', 'designersDiscount'); // Use collection filter

      if (filters.brands.length > 0) {
        params.append('brands', filters.brands.join(','));
      }

      if (filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (!isNaN(min)) params.append('minPrice', String(min));
        if (!isNaN(max)) params.append('maxPrice', String(max));
      }

      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      console.log('🔍 Fetching designers discount products with params:', params.toString());

      const response = await fetch(`${API_URL}/products?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      console.log('📊 API Response:', data);
      
      const fetchedProducts = data.products || data.items || [];
      const apiTotal = data.total || data.count || fetchedProducts.length;
      
      console.log(`📦 Fetched ${fetchedProducts.length} products, total: ${apiTotal}`);
      
      setAllProducts(fetchedProducts);
      setApiTotal(apiTotal);

      // Apply client-side filtering
      let filteredProducts = [...fetchedProducts];

      // Filter by Brands (if any selected)
      if (filters.brands.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          filters.brands.includes(p.brand)
        );
        console.log(`✅ After brand filter: ${filteredProducts.length} products`);
      }

      // Filter by Price Range
      if (filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number);
        filteredProducts = filteredProducts.filter(p => {
          const price = p.price || 0;
          if (!isNaN(min) && price < min) return false;
          if (!isNaN(max) && price > max) return false;
          return true;
        });
        console.log(`✅ After price filter: ${filteredProducts.length} products`);
      }

      // Sort products
      filteredProducts.sort((a, b) => {
        let comparison = 0;
        
        switch (filters.sortBy) {
          case 'price':
            comparison = (a.price || 0) - (b.price || 0);
            break;
          case 'name':
            comparison = (a.name || '').localeCompare(b.name || '');
            break;
          case 'rating':
            comparison = (a.rating || 0) - (b.rating || 0);
            break;
          case 'createdAt':
          default:
            comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            break;
        }
        
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });

      console.log(`✅ After client-side category filter: ${fetchedProducts.length} -> ${filteredProducts.length} products`);

      setProducts(filteredProducts);
      setAllProducts(filteredProducts);
      // Use API total for pagination, but if we have filters, use filtered count
      const effectiveTotal = (filters.brands.length > 0 || filters.priceRange !== 'all') ? filteredProducts.length : apiTotal;
      setTotalProducts(effectiveTotal);
      console.log(`Final total products for pagination: ${effectiveTotal}`);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
      setIsLoadingProducts(false);
      setIsFiltering(false);
    }
  }, [filters.brands, filters.priceRange, filters.sortBy, filters.sortOrder, currentPage, allProducts.length]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentPage(1);
    setFilters({ priceRange: 'all', brands: [], sortBy: 'createdAt', sortOrder: 'desc' });
  }, []);

  const resetFilters = () => {
    setFilters({
      priceRange: 'all',
      brands: [],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
    setShowBrandDropdown(false);
    setShowPriceDropdown(false);
    setShowSortDropdown(false);
  };

  const toggleBrand = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand],
    }));
    setCurrentPage(1);
  };

  const displayedCount = allProducts.length;
  const actualTotal = totalProducts;
  const totalPages = Math.max(1, Math.ceil(actualTotal / (filters.brands.length > 0 || filters.priceRange !== 'all' ? 500 : PRODUCTS_PER_PAGE)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gold transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back</span>
            </button>
            
            <h1 className="text-xl font-bold text-gray-900">Designers On Discount</h1>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Showing {displayedCount} of {actualTotal} products
              </span>
              {displayedCount !== actualTotal && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gold hover:text-gold/80 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white shadow-sm p-4 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Multi-Select Brand Filter */}
            <div ref={brandDropdownRef} className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Brands ({filters.brands.length})</label>
              <button
                type="button"
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:border-gold/50 bg-white hover:border-gold/50 transition"
              >
                <span className="truncate">{filters.brands.length === 0 ? 'All Brands' : filters.brands.slice(0, 2).join(', ') + (filters.brands.length > 2 ? '...' : '')}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0 ml-1" />
              </button>

              {showBrandDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1">
                      <input 
                        type="checkbox" 
                        checked={filters.brands.length === 0} 
                        onChange={() => { 
                          setFilters(prev => ({ ...prev, brands: [] })); 
                          setCurrentPage(1); 
                        }} 
                        className="w-4 h-4" 
                      />
                      <span className="text-sm font-medium">All Brands</span>
                    </label>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2">
                    {brands.length === 0 ? (
                      <div className="text-sm text-gray-500 p-2">No brands available</div>
                    ) : (
                      brands.map(brand => (
                        <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2">
                          <input 
                            type="checkbox" 
                            checked={filters.brands.includes(brand)} 
                            onChange={() => toggleBrand(brand)} 
                            className="w-4 h-4 rounded border-gray-300" 
                          />
                          <span className="text-sm">{brand}</span>
                          {filters.brands.includes(brand) && <Check className="w-3 h-3 ml-auto text-gold" />}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price Range Filter */}
            <div ref={priceDropdownRef} className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Price Range</label>
              <button
                type="button"
                onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:border-gold/50 bg-white hover:border-gold/50 transition"
              >
                <span className="truncate">
                  {filters.priceRange === 'all' ? 'All Prices' : 
                   filters.priceRange === '0-5000' ? 'Under Rs. 5,000' :
                   filters.priceRange === '5000-10000' ? 'Rs. 5,000 - 10,000' :
                   filters.priceRange === '10000-20000' ? 'Rs. 10,000 - 20,000' :
                   'Above Rs. 20,000'}
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0 ml-1" />
              </button>

              {showPriceDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  {[
                    { value: 'all', label: 'All Prices' },
                    { value: '0-5000', label: 'Under Rs. 5,000' },
                    { value: '5000-10000', label: 'Rs. 5,000 - 10,000' },
                    { value: '10000-20000', label: 'Rs. 10,000 - 20,000' },
                    { value: '20000+', label: 'Above Rs. 20,000' }
                  ].map(option => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-3 border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="radio"
                        name="priceRange"
                        value={option.value}
                        checked={filters.priceRange === option.value}
                        onChange={() => {
                          setFilters(prev => ({ ...prev, priceRange: option.value as any }));
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Options */}
            <div ref={sortDropdownRef} className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:border-gold/50 bg-white hover:border-gold/50 transition"
              >
                <span className="truncate">
                  {filters.sortBy === 'createdAt' ? 'Newest First' :
                   filters.sortBy === 'price' ? 'Price: Low to High' :
                   filters.sortBy === 'name' ? 'Name: A to Z' :
                   'Rating: High to Low'}
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0 ml-1" />
              </button>

              {showSortDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                  {[
                    { value: 'createdAt', label: 'Newest First' },
                    { value: 'price', label: 'Price: Low to High' },
                    { value: 'name', label: 'Name: A to Z' },
                    { value: 'rating', label: 'Rating: High to Low' }
                  ].map(option => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-3 border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="radio"
                        name="sortBy"
                        value={option.value}
                        checked={filters.sortBy === option.value}
                        onChange={() => {
                          setFilters(prev => ({ ...prev, sortBy: option.value as any }));
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoadingProducts ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="relative">
                    <LazyImage
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-64 object-cover rounded-t-lg"
                      onError={handleImageError}
                    />
                    
                    {/* Discount Badge */}
                    {product.discountPercentage && product.discountPercentage > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        {Math.round(product.discountPercentage)}% OFF
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">{product.brand}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.discountPercentage && product.discountPercentage > 0 ? (
                          <>
                            <span className="text-lg font-bold text-gray-400 line-through">
                              Rs. {product.originalPrice?.toLocaleString()}
                            </span>
                            <span className="text-lg font-bold text-gold">
                              Rs. {product.price?.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gold">
                            Rs. {product.price?.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => navigate(getProductUrl(product))}
                        className="p-2 text-gold hover:bg-gold/50 rounded-lg transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        window.scrollTo(0, 0);
                      }}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        window.scrollTo(0, 0);
                      }}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
        )}
      </div>
    </div>
  );
}
