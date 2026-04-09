/**
 * AI Outfit Combination Generator
 * Suggests complete outfits by intelligently matching products
 * FREE - No external API needed, uses smart algorithms
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  image: string;
  brand?: string;
  colors?: string[];
  tags?: string[];
  description?: string;
}

export interface OutfitSuggestion {
  items: Product[];
  totalPrice: number;
  discount?: number;
  confidence: number; // 0-100 how well items match
  style: string;
  occasion?: string;
  reasoning: string;
}

// Category compatibility map
const CATEGORY_MATCHING: Record<string, string[]> = {
  // Tops
  'kurta': ['trousers', 'shalwar', 'churidar', 'jeans', 'leggings', 'dupatta', 'shawl'],
  'shirt': ['trousers', 'jeans', 'chinos', 'blazer', 'jacket'],
  't-shirt': ['jeans', 'shorts', 'chinos', 'jacket'],
  'blouse': ['saree', 'lehenga', 'trousers', 'jeans', 'skirt'],
  'kameez': ['shalwar', 'churidar', 'trousers', 'dupatta'],
  
  // Bottoms
  'trousers': ['kurta', 'shirt', 'kameez', 'blazer'],
  'shalwar': ['kurta', 'kameez'],
  'churidar': ['kurta', 'kameez'],
  'jeans': ['shirt', 't-shirt', 'kurta', 'blouse', 'jacket'],
  'leggings': ['kurta', 'long-tunic', 'kameez'],
  
  // Outerwear
  'blazer': ['shirt', 'trousers', 'dress'],
  'jacket': ['shirt', 't-shirt', 'dress'],
  'shawl': ['kurta', 'kameez', 'dress'],
  'dupatta': ['kurta', 'kameez', 'lehenga'],
  
  // Dresses
  'dress': ['heels', 'jewelry', 'clutch'],
  'lehenga': ['choli', 'dupatta', 'blouse'],
  'saree': ['blouse', 'petticoat'],
  
  // Accessories
  'jewelry': ['dress', 'lehenga', 'saree', 'formal'],
  'shoes': ['any'],
  'bag': ['any'],
  'clutch': ['dress', 'lehenga', 'formal'],
};

// Style profiles for different occasions
const OCCASION_STYLES: Record<string, { categories: string[]; priceMultiplier: number }> = {
  'wedding': {
    categories: ['lehenga', 'saree', 'formal-dress', 'sherwani', 'suit'],
    priceMultiplier: 2.5,
  },
  'casual': {
    categories: ['t-shirt', 'jeans', 'casual-shirt', 'shorts'],
    priceMultiplier: 1.0,
  },
  'formal': {
    categories: ['blazer', 'trousers', 'formal-shirt', 'dress'],
    priceMultiplier: 1.8,
  },
  'eid': {
    categories: ['kurta', 'kameez', 'formal-dress'],
    priceMultiplier: 1.5,
  },
  'party': {
    categories: ['dress', 'cocktail-dress', 'formal-shirt', 'trousers'],
    priceMultiplier: 1.6,
  },
  'office': {
    categories: ['trousers', 'blazer', 'formal-shirt', 'blouse'],
    priceMultiplier: 1.3,
  },
};

/**
 * Generate outfit combinations for a selected item
 * @param selectedItem - The product user selected
 * @param allProducts - All available products
 * @param options - Customization options
 */
export function generateOutfitCombinations(
  selectedItem: Product,
  allProducts: Product[],
  options: {
    maxItems?: number;
    budget?: number;
    occasion?: string;
    style?: string;
    excludeCategories?: string[];
  } = {}
): OutfitSuggestion[] {
  const {
    maxItems = 4,
    budget,
    occasion,
    excludeCategories = [],
  } = options;

  const suggestions: OutfitSuggestion[] = [];

  // Get compatible categories for selected item
  const compatibleCategories = getCompatibleCategories(selectedItem.category);

  // Find matching products
  const compatibleProducts = allProducts.filter(p => 
    compatibleCategories.includes(p.category) &&
    !excludeCategories.includes(p.category) &&
    p.id !== selectedItem.id
  );

  // Generate different outfit styles
  if (occasion && OCCASION_STYLES[occasion]) {
    // Occasion-specific outfit
    suggestions.push(
      generateOccasionOutfit(selectedItem, compatibleProducts, occasion, maxItems, budget)
    );
  }

  // Classic combination
  suggestions.push(
    generateClassicOutfit(selectedItem, compatibleProducts, maxItems, budget)
  );

  // Trending combination
  suggestions.push(
    generateTrendingOutfit(selectedItem, compatibleProducts, maxItems, budget)
  );

  // Budget-friendly option
  suggestions.push(
    generateBudgetOutfit(selectedItem, compatibleProducts, maxItems)
  );

  return suggestions.filter(Boolean).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get categories that match with the selected category
 */
function getCompatibleCategories(category: string): string[] {
  const normalizedCategory = category.toLowerCase();
  
  // Direct match
  if (CATEGORY_MATCHING[normalizedCategory]) {
    return CATEGORY_MATCHING[normalizedCategory];
  }

  // Partial match
  for (const [key, categories] of Object.entries(CATEGORY_MATCHING)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return categories;
    }
  }

  // Default: return common categories
  return ['any'];
}

/**
 * Generate a classic outfit combination
 */
function generateClassicOutfit(
  selectedItem: Product,
  compatibleProducts: Product[],
  maxItems: number,
  budget?: number
): OutfitSuggestion {
  const items = [selectedItem];
  let totalPrice = selectedItem.price;

  // Add complementary items
  const sorted = sortByRelevance(compatibleProducts, selectedItem);
  
  for (const product of sorted) {
    if (items.length >= maxItems) break;
    if (budget && totalPrice + product.price > budget) continue;

    items.push(product);
    totalPrice += product.price;
  }

  const discount = items.length >= 3 ? 10 : items.length >= 2 ? 5 : 0;
  const finalPrice = totalPrice * (1 - discount / 100);

  return {
    items,
    totalPrice: finalPrice,
    discount,
    confidence: calculateConfidence(items),
    style: 'Classic',
    reasoning: `Timeless combination that always works. ${items.length >= 3 ? 'Complete outfit with matching pieces.' : 'Essential pieces that complement each other.'}`,
  };
}

/**
 * Generate a trending outfit combination
 */
function generateTrendingOutfit(
  selectedItem: Product,
  compatibleProducts: Product[],
  maxItems: number,
  budget?: number
): OutfitSuggestion {
  const items = [selectedItem];
  let totalPrice = selectedItem.price;

  // Sort by popularity (simulated by tags)
  const sorted = compatibleProducts
    .filter(p => p.tags?.some(tag => 
      tag.toLowerCase().includes('trending') ||
      tag.toLowerCase().includes('popular') ||
      tag.toLowerCase().includes('new')
    ))
    .concat(sortByRelevance(compatibleProducts, selectedItem))
    .slice(0, maxItems - 1);

  for (const product of sorted) {
    if (items.length >= maxItems) break;
    if (budget && totalPrice + product.price > budget) continue;

    items.push(product);
    totalPrice += product.price;
  }

  const discount = items.length >= 3 ? 12 : items.length >= 2 ? 6 : 0;
  const finalPrice = totalPrice * (1 - discount / 100);

  return {
    items,
    totalPrice: finalPrice,
    discount,
    confidence: calculateConfidence(items) - 5,
    style: 'Trending',
    reasoning: 'Currently trending styles based on customer preferences. Be the first to rock this look!',
  };
}

/**
 * Generate a budget-friendly outfit
 */
function generateBudgetOutfit(
  selectedItem: Product,
  compatibleProducts: Product[],
  maxItems: number
): OutfitSuggestion {
  const items = [selectedItem];
  let totalPrice = selectedItem.price;

  // Sort by price (cheapest first)
  const sorted = [...compatibleProducts].sort((a, b) => a.price - b.price);

  for (const product of sorted) {
    if (items.length >= maxItems) break;
    items.push(product);
    totalPrice += product.price;
  }

  const discount = items.length >= 3 ? 15 : 8;
  const finalPrice = totalPrice * (1 - discount / 100);

  return {
    items,
    totalPrice: finalPrice,
    discount,
    confidence: calculateConfidence(items) - 10,
    style: 'Budget-Friendly',
    reasoning: `Best value combination! Save ${discount}% when you buy the complete look.`,
  };
}

/**
 * Generate occasion-specific outfit
 */
function generateOccasionOutfit(
  selectedItem: Product,
  compatibleProducts: Product[],
  occasion: string,
  maxItems: number,
  budget?: number
): OutfitSuggestion {
  const styleConfig = OCCASION_STYLES[occasion];
  const items = [selectedItem];
  let totalPrice = selectedItem.price;

  // Filter by occasion-appropriate categories
  const occasionProducts = compatibleProducts.filter(p =>
    styleConfig.categories.some(cat => 
      p.category.toLowerCase().includes(cat) ||
      p.tags?.some(tag => tag.toLowerCase().includes(occasion))
    )
  );

  const sorted = sortByRelevance(occasionProducts, selectedItem);

  for (const product of sorted) {
    if (items.length >= maxItems) break;
    if (budget && totalPrice + product.price > budget) continue;

    items.push(product);
    totalPrice += product.price;
  }

  const discount = items.length >= 3 ? 15 : items.length >= 2 ? 8 : 0;
  const finalPrice = totalPrice * (1 - discount / 100);

  return {
    items,
    totalPrice: finalPrice,
    discount,
    confidence: calculateConfidence(items) + 5,
    style: capitalize(occasion),
    occasion,
    reasoning: `Perfect for ${occasion}! Curated to match the dress code and style expectations.`,
  };
}

/**
 * Sort products by relevance to selected item
 */
function sortByRelevance(products: Product[], selectedItem: Product): Product[] {
  return products
    .map(product => ({
      product,
      score: calculateRelevanceScore(product, selectedItem),
    }))
    .sort((a, b) => b.score - a.score)
    .map(p => p.product);
}

/**
 * Calculate relevance score between two products
 */
function calculateRelevanceScore(product: Product, target: Product): number {
  let score = 0;

  // Color matching (highest priority)
  if (product.colors && target.colors) {
    const matchingColors = product.colors.filter(c =>
      target.colors?.includes(c)
    );
    score += matchingColors.length * 20;
  }

  // Brand matching
  if (product.brand && target.brand && product.brand === target.brand) {
    score += 15;
  }

  // Tag matching
  if (product.tags && target.tags) {
    const matchingTags = product.tags.filter(t =>
      target.tags?.includes(t)
    );
    score += matchingTags.length * 10;
  }

  // Price range compatibility
  const priceRatio = product.price / target.price;
  if (priceRatio >= 0.5 && priceRatio <= 2.0) {
    score += 10; // Similar price range
  }

  return score;
}

/**
 * Calculate confidence score for an outfit
 */
function calculateConfidence(items: Product[]): number {
  if (items.length < 2) return 0;

  let confidence = 50; // Base confidence

  // More items = higher confidence (up to a point)
  confidence += Math.min(items.length * 5, 20);

  // Color harmony
  const allColors = items.flatMap(p => p.colors || []);
  if (allColors.length > 0) {
    const uniqueColors = new Set(allColors);
    if (uniqueColors.size <= 3) {
      confidence += 15; // Coherent color palette
    }
  }

  // Brand consistency
  const brands = items.filter(p => p.brand).map(p => p.brand);
  if (brands.length > 0) {
    const uniqueBrands = new Set(brands);
    if (uniqueBrands.size === 1) {
      confidence += 10; // Same brand
    }
  }

  return Math.min(confidence, 98);
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get style tips for an outfit
 */
export function getStyleTips(outfit: OutfitSuggestion): string[] {
  const tips: string[] = [];

  if (outfit.items.length >= 3) {
    tips.push('✨ Complete look! You have all the essentials.');
  }

  if (outfit.discount) {
    tips.push(`💰 Save ${outfit.discount}% when you buy this complete outfit!`);
  }

  // Check for color coordination
  const allColors = outfit.items.flatMap(p => p.colors || []);
  const colorCounts = allColors.reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominantColor) {
    tips.push(`🎨 ${dominantColor[0]} is your dominant tone - great choice!`);
  }

  if (outfit.style === 'Classic') {
    tips.push('👌 Timeless style that never goes out of fashion.');
  } else if (outfit.style === 'Trending') {
    tips.push('🔥 On-trend look that\'s hot right now!');
  } else if (outfit.occasion) {
    tips.push(`🎯 Perfectly styled for ${outfit.occasion}!`);
  }

  return tips;
}
