import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearchProducts, type SearchFilters } from '@/hooks/useSearchProducts';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters as SearchFiltersComponent } from '@/components/search/SearchFilters';
import { ProductGrid } from '@/components/search/ProductGrid';
import { Loader2, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const query = searchParams.get('q') || '';
  const [filters, setFilters] = useState<SearchFilters>({
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'relevance',
    inStock: searchParams.get('inStock') === 'true',
    onSale: searchParams.get('onSale') === 'true',
  });

  const {
    data,
    isLoading,
    isFetching,
    error,
    isDebouncing,
    setSearchTerm
  } = useSearchProducts(query, filters);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.category) params.set('category', filters.category);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.sortBy && filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.onSale) params.set('onSale', 'true');
    
    setSearchParams(params);
  }, [query, filters]);

  const handleSearch = (newQuery: string) => {
    setSearchTerm(newQuery);
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      sortBy: 'relevance'
    });
  };

  const hasFilters = Object.keys(filters).some(key => 
    filters[key as keyof SearchFilters] !== undefined && 
    filters[key as keyof SearchFilters] !== 'relevance'
  );

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Sticky Search Header */}
      <div className="sticky top-0 bg-white shadow-md z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <SearchBar 
              onSearch={handleSearch}
              autoFocus
              placeholder="Search products..."
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {query ? `Search results for "${query}"` : 'Search Products'}
          </h1>
          
          {data && !isLoading && (
            <p className="text-gray-600 mt-1">
              Found {data.total} products
              {isFetching && !isDebouncing && ' (updating...)'}
            </p>
          )}

          {/* Did you mean? */}
          {data?.didYouMean && data.didYouMean.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-600">Did you mean: </span>
              {data.didYouMean.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(suggestion)}
                  className="text-gold hover:underline text-sm ml-2"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="lg:hidden w-full mb-4 bg-white p-3 rounded-lg shadow flex items-center justify-center gap-2"
        >
          <Filter className="w-5 h-5" />
          Filters
          {hasFilters && (
            <Badge className="bg-gold text-white ml-2">
              {Object.keys(filters).filter(k => filters[k as keyof SearchFilters] && k !== 'sortBy').length}
            </Badge>
          )}
        </button>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`
            lg:block lg:w-64 flex-shrink-0
            ${showMobileFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden'}
          `}>
            {showMobileFilters && (
              <div className="flex justify-between items-center mb-6 lg:hidden">
                <h2 className="text-xl font-bold">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            <SearchFiltersComponent
              filters={filters}
              onFilterChange={updateFilters}
              facets={data?.facets}
              onClear={clearFilters}
            />
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Active Filters */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.category && (
                  <FilterChip
                    label={`Category: ${filters.category}`}
                    onRemove={() => updateFilters({ category: undefined })}
                  />
                )}
                {filters.brand && (
                  <FilterChip
                    label={`Brand: ${filters.brand}`}
                    onRemove={() => updateFilters({ brand: undefined })}
                  />
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <FilterChip
                    label={`Price: $${filters.minPrice || 0} - $${filters.maxPrice || 'Any'}`}
                    onRemove={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}
                  />
                )}
                {filters.inStock && (
                  <FilterChip
                    label="In Stock Only"
                    onRemove={() => updateFilters({ inStock: false })}
                  />
                )}
                {filters.onSale && (
                  <FilterChip
                    label="On Sale"
                    onRemove={() => updateFilters({ onSale: false })}
                  />
                )}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">Failed to load search results</p>
                <Button variant="link" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              </div>
            )}

            {/* Results Grid */}
            {data && data.results.length > 0 && (
              <>
                <ProductGrid products={data.results} />
                
                {/* Results count */}
                {data.total > data.results.length && (
                  <p className="text-center text-gray-600 mt-8">
                    Showing {data.results.length} of {data.total} products
                  </p>
                )}
              </>
            )}

            {/* No Results */}
            {data && data.results.length === 0 && !isLoading && (
              <div className="text-center py-12 bg-white rounded-lg">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button variant="link" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1 bg-white border rounded-full pl-3 pr-2 py-1">
      <span className="text-sm">{label}</span>
      <button
        onClick={onRemove}
        className="p-1 hover:bg-gray-100 rounded-full"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
