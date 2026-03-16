import type { SearchFilters, SearchResponse } from '@/hooks/useSearchProducts';
import { Slider } from '@/components/ui/slider';
import { Star } from 'lucide-react';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
  facets?: SearchResponse['facets'];
  onClear: () => void;
}

export function SearchFilters({ 
  filters, 
  onFilterChange, 
  facets,
  onClear 
}: SearchFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Sort By */}
      <div>
        <h3 className="font-medium mb-3">Sort By</h3>
        <select
          value={filters.sortBy || 'relevance'}
          onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
          className="w-full border rounded-lg p-2"
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Categories */}
      {facets?.categories && (
        <div>
          <h3 className="font-medium mb-3">Categories</h3>
          <div className="space-y-2">
            {facets.categories.map((category) => (
              <label key={category.name} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    value={category.name}
                    checked={filters.category === category.name}
                    onChange={(e) => onFilterChange({ 
                      category: e.target.checked ? category.name : undefined 
                    })}
                    className="rounded text-gold focus:ring-gold"
                  />
                  <span className="text-sm">{category.name}</span>
                </div>
                <span className="text-xs text-gray-500">({category.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {facets?.brands && (
        <div>
          <h3 className="font-medium mb-3">Brands</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {facets.brands.map((brand) => (
              <label key={brand.name} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={brand.name}
                    checked={filters.brand === brand.name}
                    onChange={(e) => onFilterChange({ 
                      brand: e.target.checked ? brand.name : undefined 
                    })}
                    className="rounded text-gold focus:ring-gold"
                  />
                  <span className="text-sm">{brand.name}</span>
                </div>
                <span className="text-xs text-gray-500">({brand.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            min={0}
            max={1000}
            step={10}
            value={[
              filters.minPrice || 0,
              filters.maxPrice || 1000
            ]}
            onValueChange={([min, max]) => 
              onFilterChange({ 
                minPrice: min === 0 ? undefined : min,
                maxPrice: max === 1000 ? undefined : max
              })
            }
            className="mb-2"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>${filters.minPrice || 0}</span>
            <span>${filters.maxPrice || 1000}+</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-medium mb-3">Minimum Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={filters.rating === rating}
                onChange={(e) => onFilterChange({ 
                  rating: e.target.checked ? rating : undefined 
                })}
                className="rounded text-gold focus:ring-gold"
              />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-sm ml-1">& up</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Other Filters */}
      <div>
        <h3 className="font-medium mb-3">Other</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => onFilterChange({ inStock: e.target.checked })}
              className="rounded text-gold focus:ring-gold"
            />
            <span className="text-sm">In Stock Only</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.onSale}
              onChange={(e) => onFilterChange({ onSale: e.target.checked })}
              className="rounded text-gold focus:ring-gold"
            />
            <span className="text-sm">On Sale</span>
          </label>
        </div>
      </div>

      {/* Clear Button */}
      <button
        onClick={onClear}
        className="w-full text-center text-gold hover:underline text-sm font-medium py-2"
      >
        Clear all filters
      </button>
    </div>
  );
}
