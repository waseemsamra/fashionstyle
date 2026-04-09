import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sparkles, ShoppingCart, Filter, ChevronRight, TrendingUp } from 'lucide-react';
import {
  getAllOccasions,
  getOccasionById,
  filterProductsByOccasion,
  getOccasionOutfitBundles,
  getTrendingOccasions,
  type OccasionFilters,
} from '@/services/occasionShoppingService';
import LazyImage from '@/components/ui/LazyImage';

interface OccasionShoppingProps {
  products: any[];
  onAddToCart?: (productId: string, quantity: number) => void;
  onViewProduct?: (productId: string) => void;
}

export default function OccasionShopping({
  products,
  onAddToCart,
  onViewProduct,
}: OccasionShoppingProps) {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('');
  const [budgetRange, setBudgetRange] = useState<[number, number]>([1000, 50000]);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredResults, setFilteredResults] = useState<any>(null);
  const [outfitBundles, setOutfitBundles] = useState<any[]>([]);
  const trendingOccasions = getTrendingOccasions();
  const occasions = getAllOccasions();

  // Auto-select first occasion
  useEffect(() => {
    if (!selectedOccasion && occasions.length > 0) {
      setSelectedOccasion(occasions[0].id);
    }
  }, []);

  // Filter products when occasion or budget changes
  useEffect(() => {
    if (selectedOccasion && products.length > 0) {
      const filters: OccasionFilters = {
        budget: { min: budgetRange[0], max: budgetRange[1] },
      };

      const results = filterProductsByOccasion(products, selectedOccasion, filters);
      setFilteredResults(results);

      const bundles = getOccasionOutfitBundles(products, selectedOccasion, 5);
      setOutfitBundles(bundles);
    }
  }, [selectedOccasion, budgetRange, products]);

  const selectedOcc = getOccasionById(selectedOccasion);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-3xl font-playfair font-bold">Shop By Occasion</h2>
        </div>
        <p className="text-gray-600">Let AI curate the perfect outfit for your special moment</p>
      </div>

      {/* Trending Badges */}
      <div className="flex items-center gap-2 justify-center flex-wrap">
        <TrendingUp className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Trending:</span>
        {trendingOccasions.map(occId => {
          const occ = getOccasionById(occId);
          return occ ? (
            <button
              key={occId}
              onClick={() => setSelectedOccasion(occId)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                selectedOccasion === occId
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {occ.icon} {occ.name}
            </button>
          ) : null;
        })}
      </div>

      {/* Occasion Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {occasions.map(occasion => (
          <button
            key={occasion.id}
            onClick={() => setSelectedOccasion(occasion.id)}
            className={`relative p-4 rounded-lg border-2 transition-all text-left ${
              selectedOccasion === occasion.id
                ? 'border-purple-600 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="text-3xl mb-2">{occasion.icon}</div>
            <h3 className="font-semibold text-sm">{occasion.name}</h3>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{occasion.description}</p>
            {trendingOccasions.includes(occasion.id) && (
              <Badge className="absolute top-2 right-2 bg-orange-500 text-xs">
                Trending
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Budget Filter */}
      {selectedOcc && (
        <Card className="border-purple-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <h3 className="font-semibold">Budget Range</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>

            <div className="space-y-2">
              <Slider
                value={budgetRange}
                onValueChange={(value) => setBudgetRange(value as [number, number])}
                min={500}
                max={100000}
                step={500}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>PKR {budgetRange[0].toLocaleString()}</span>
                <span>PKR {budgetRange[1].toLocaleString()}</span>
              </div>
            </div>

            {/* Recommendations */}
            {filteredResults && filteredResults.recommendations && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 space-y-1">
                {filteredResults.recommendations.map((rec: string, idx: number) => (
                  <p key={idx} className="text-sm text-gray-700">{rec}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Stats */}
      {filteredResults && selectedOcc && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {selectedOcc.icon} {selectedOcc.name} Collection
              </h3>
              <p className="text-sm text-gray-600">
                {filteredResults.products.length} items • {filteredResults.totalOutfits} complete outfits • Avg PKR {filteredResults.avgPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Outfit Bundles */}
      {outfitBundles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-playfair font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Ready-Made Outfit Bundles
          </h3>

          <div className="space-y-4">
            {outfitBundles.slice(0, 3).map((bundle, index) => (
              <Card key={index} className="border-purple-200 hover:shadow-lg transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold">{bundle.name}</h4>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Save {bundle.discount}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {bundle.items.slice(0, 3).map((item: any) => (
                      <div
                        key={item.id}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => onViewProduct?.(item.id)}
                      >
                        <LazyImage
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        PKR {bundle.totalPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{bundle.items.length} items</p>
                    </div>
                    <Button
                      onClick={() => {
                        bundle.items.forEach((item: any) => {
                          onAddToCart?.(item.id, 1);
                        });
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add All
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Individual Products */}
      {filteredResults && filteredResults.products.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-playfair font-bold">All Items</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredResults.products.slice(0, 12).map((product: any) => (
              <Card
                key={product.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                onClick={() => onViewProduct?.(product.id)}
              >
                <div className="aspect-square relative">
                  <LazyImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2 bg-white/90">
                    PKR {product.price.toLocaleString()}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.brand}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredResults.products.length > 12 && (
            <Button variant="outline" className="w-full">
              Load More ({filteredResults.products.length - 12} items)
            </Button>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredResults && filteredResults.products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-6xl mb-4">🤔</p>
          <h3 className="text-xl font-bold mb-2">No items found</h3>
          <p className="text-gray-600">Try adjusting your budget range or select a different occasion</p>
        </div>
      )}
    </div>
  );
}
