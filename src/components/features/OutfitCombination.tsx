import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ShoppingCart, ChevronRight, Star, Package } from 'lucide-react';
import { getProductImage } from '@/utils/productImage';
import {
  generateOutfitCombinations,
  type Product,
  type OutfitSuggestion,
  getStyleTips,
} from '@/services/outfitCombinationService';

interface OutfitCombinationProps {
  selectedProduct: Product;
  allProducts: Product[];
  onAddToCart?: (items: Product[]) => void;
  budget?: number;
  occasion?: string;
}

export default function OutfitCombination({
  selectedProduct,
  allProducts,
  onAddToCart,
  budget,
  occasion,
}: OutfitCombinationProps) {
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number>(0);

  useEffect(() => {
    const combos = generateOutfitCombinations(selectedProduct, allProducts, {
      budget,
      occasion,
      maxItems: 4,
    });
    setSuggestions(combos);
  }, [selectedProduct, allProducts, budget, occasion]);

  if (suggestions.length === 0) {
    return null;
  }

  const currentSuggestion = suggestions[selectedSuggestion];
  const styleTips = getStyleTips(currentSuggestion);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-xl font-playfair font-bold">Complete The Look</h3>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          AI Styled
        </Badge>
      </div>

      {/* Style Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.style}
            onClick={() => setSelectedSuggestion(index)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedSuggestion === index
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {suggestion.style}
          </button>
        ))}
      </div>

      {/* Selected Outfit Display */}
      {currentSuggestion && (
        <div className="space-y-4">
          {/* Outfit Items */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentSuggestion.items.map((item, index) => (
              <Card
                key={item.id}
                className="relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="aspect-square relative">
                  <img
                    src={getProductImage(item)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <Badge className="absolute top-2 left-2 bg-purple-600">
                      Your Pick
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.brand}</p>
                  <p className="text-sm font-bold mt-1">PKR {item.price.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Style Tips */}
          {styleTips.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 space-y-2">
              {styleTips.map((tip, index) => (
                <p key={index} className="text-sm text-gray-700">
                  {tip}
                </p>
              ))}
            </div>
          )}

          {/* Pricing & CTA */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Complete Outfit Price</p>
                {currentSuggestion.discount && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 mt-1">
                    Save {currentSuggestion.discount}%
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">
                  PKR {currentSuggestion.totalPrice.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {currentSuggestion.items.length} items • {Math.round(currentSuggestion.confidence)}% match
                </p>
              </div>
            </div>

            <Button
              onClick={() => onAddToCart?.(currentSuggestion.items)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              size="lg"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add Complete Outfit to Cart
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>{Math.round(currentSuggestion.confidence)}% style match</span>
            </div>
          </div>
        </div>
      )}

      {/* View All Combinations */}
      {suggestions.length > 1 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            // Could open a modal showing all combinations
            console.log('Show all combinations');
          }}
        >
          <Package className="w-4 h-4 mr-2" />
          View {suggestions.length} Style Options
        </Button>
      )}
    </div>
  );
}
