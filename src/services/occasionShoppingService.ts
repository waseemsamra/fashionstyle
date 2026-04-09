/**
 * AI Occasion-Based Shopping Service
 * Curates perfect outfits based on occasion, budget, and preferences
 * FREE - Smart filtering algorithm, no external API needed
 */

export interface OccasionConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: string[];
  priceRange: { min: number; max: number };
  styles: string[];
  colors: string[];
  season?: string[];
  dressCode?: 'casual' | 'semi-formal' | 'formal' | 'traditional';
}

export interface OccasionFilters {
  budget: { min: number; max: number };
  style?: string;
  size?: string;
  colors?: string[];
  gender?: 'men' | 'women' | 'unisex';
  season?: string;
}

export interface OccasionResult {
  products: any[];
  totalOutfits: number;
  avgPrice: number;
  recommendations: string[];
}

// Predefined occasions with smart configurations
export const OCCASIONS: OccasionConfig[] = [
  {
    id: 'wedding',
    name: 'Wedding',
    description: 'Stunning outfits for weddings and formal celebrations',
    icon: '💒',
    categories: ['bridal', 'formal', 'sherwani', 'lehenga', 'saree', 'suit'],
    priceRange: { min: 5000, max: 100000 },
    styles: ['traditional', 'modern', 'bridal', 'groom'],
    colors: ['red', 'gold', 'maroon', 'ivory', 'emerald'],
    dressCode: 'formal',
  },
  {
    id: 'eid',
    name: 'Eid Celebration',
    description: 'Festive and elegant outfits for Eid',
    icon: '🌙',
    categories: ['kurta', 'kameez', 'casual-formal', 'dress'],
    priceRange: { min: 2000, max: 25000 },
    styles: ['traditional', 'festive', 'elegant'],
    colors: ['white', 'pastel', 'blue', 'green', 'gold'],
    dressCode: 'semi-formal',
  },
  {
    id: 'casual',
    name: 'Casual Wear',
    description: 'Comfortable everyday outfits',
    icon: '👕',
    categories: ['t-shirt', 'jeans', 'casual-shirt', 'kurti', 'trousers'],
    priceRange: { min: 500, max: 5000 },
    styles: ['casual', 'comfortable', 'everyday'],
    colors: ['any'],
    dressCode: 'casual',
  },
  {
    id: 'office',
    name: 'Office & Work',
    description: 'Professional and polished work attire',
    icon: '💼',
    categories: ['trousers', 'shirt', 'blazer', 'blouse', 'formal-shirt'],
    priceRange: { min: 1500, max: 15000 },
    styles: ['professional', 'minimal', 'classic'],
    colors: ['black', 'white', 'navy', 'gray', 'beige'],
    dressCode: 'formal',
  },
  {
    id: 'party',
    name: 'Party & Night Out',
    description: 'Trendy outfits for parties and events',
    icon: '🎉',
    categories: ['dress', 'cocktail', 'formal-shirt', 'trousers', 'blazer'],
    priceRange: { min: 3000, max: 30000 },
    styles: ['trendy', 'modern', 'cocktail'],
    colors: ['black', 'red', 'gold', 'silver', 'navy'],
    dressCode: 'semi-formal',
  },
  {
    id: 'mehndi',
    name: 'Mehndi Ceremony',
    description: 'Vibrant and colorful outfits for mehndi',
    icon: '🌼',
    categories: ['lehenga', 'gharara', 'kurti', 'sharara'],
    priceRange: { min: 5000, max: 50000 },
    styles: ['traditional', 'colorful', 'festive'],
    colors: ['yellow', 'green', 'orange', 'pink', 'multi'],
    dressCode: 'traditional',
  },
  {
    id: 'baraat',
    name: 'Baraat/Walima',
    description: 'Elegant formal wear for reception',
    icon: '✨',
    categories: ['formal', 'bridal', 'sherwani', 'suit', 'dress'],
    priceRange: { min: 10000, max: 150000 },
    styles: ['elegant', 'luxury', 'formal'],
    colors: ['gold', 'silver', 'ivory', 'pastel', 'white'],
    dressCode: 'formal',
  },
  {
    id: 'brunch',
    name: 'Brunch & Day Out',
    description: 'Chic and comfortable daytime outfits',
    icon: '☕',
    categories: ['dress', 'kurti', 'jeans', 'casual-shirt', 'skirt'],
    priceRange: { min: 1500, max: 10000 },
    styles: ['chic', 'casual', 'comfortable'],
    colors: ['pastel', 'white', 'floral', 'light'],
    dressCode: 'casual',
  },
];

/**
 * Get occasion configuration by ID
 */
export function getOccasionById(id: string): OccasionConfig | undefined {
  return OCCASIONS.find(occ => occ.id === id);
}

/**
 * Get all occasions
 */
export function getAllOccasions(): OccasionConfig[] {
  return OCCASIONS;
}

/**
 * Filter products based on occasion and filters
 */
export function filterProductsByOccasion(
  products: any[],
  occasionId: string,
  filters: OccasionFilters
): OccasionResult {
  const occasion = getOccasionById(occasionId);
  
  if (!occasion) {
    return {
      products: [],
      totalOutfits: 0,
      avgPrice: 0,
      recommendations: ['Please select a valid occasion'],
    };
  }

  // Filter products by occasion criteria
  let filtered = products.filter(product => {
    // Category match
    const categoryMatch = occasion.categories.some(cat =>
      product.category?.toLowerCase().includes(cat) ||
      cat.includes(product.category?.toLowerCase() || '')
    );

    if (!categoryMatch) return false;

    // Price range filter
    const price = product.price || 0;
    if (price < filters.budget.min || price > filters.budget.max) return false;

    // Color filter (optional)
    if (filters.colors && filters.colors.length > 0 && occasion.colors[0] !== 'any') {
      const colorMatch = product.colors?.some((color: string) =>
        filters.colors!.includes(color) || occasion.colors.includes(color)
      );
      if (!colorMatch) return false;
    }

    // Size filter (optional)
    if (filters.size && product.sizes) {
      if (!product.sizes.includes(filters.size)) return false;
    }

    return true;
  });

  // Sort by relevance (price within budget, popularity, etc.)
  filtered = filtered.sort((a, b) => {
    // Prioritize items in the middle of budget range (best value)
    const budgetMidpoint = (filters.budget.min + filters.budget.max) / 2;
    const aDiff = Math.abs(a.price - budgetMidpoint);
    const bDiff = Math.abs(b.price - budgetMidpoint);
    return aDiff - bDiff;
  });

  // Generate recommendations
  const recommendations = generateRecommendations(occasion, filtered, filters);

  // Calculate stats
  const avgPrice = filtered.length > 0
    ? Math.round(filtered.reduce((sum, p) => sum + p.price, 0) / filtered.length)
    : 0;

  // Estimate complete outfits (groups of 3-4 items)
  const totalOutfits = Math.floor(filtered.length / 3);

  return {
    products: filtered,
    totalOutfits,
    avgPrice,
    recommendations,
  };
}

/**
 * Generate smart recommendations
 */
function generateRecommendations(
  occasion: OccasionConfig,
  products: any[],
  filters: OccasionFilters
): string[] {
  const recommendations: string[] = [];

  // Based on occasion
  if (occasion.dressCode === 'formal') {
    recommendations.push('✨ Formal attire - perfect for the occasion!');
  } else if (occasion.dressCode === 'traditional') {
    recommendations.push('🎭 Traditional style - embrace the culture!');
  } else if (occasion.dressCode === 'casual') {
    recommendations.push('😎 Casual comfort - look good, feel good!');
  }

  // Based on budget
  if (filters.budget.max > 20000) {
    recommendations.push('💎 Premium selection - quality over quantity!');
  } else if (filters.budget.max < 5000) {
    recommendations.push('💰 Budget-friendly - style doesn\'t cost a fortune!');
  } else {
    recommendations.push('👌 Great value - balanced style and budget!');
  }

  // Based on product count
  if (products.length < 10) {
    recommendations.push('🔥 Limited pieces - grab them before they\'re gone!');
  } else if (products.length > 30) {
    recommendations.push('🎯 Lots of options - take your time to choose!');
  }

  // Occasion-specific tips
  if (occasion.id === 'wedding') {
    recommendations.push('💒 Wedding season essentials - look your best!');
  } else if (occasion.id === 'eid') {
    recommendations.push('🌙 Eid Mubarak in advance - celebrate in style!');
  } else if (occasion.id === 'mehndi') {
    recommendations.push('🌼 Go vibrant - the brighter, the better!');
  }

  return recommendations;
}

/**
 * Get outfit bundles for an occasion
 * Groups products into complete outfit combinations
 */
export function getOccasionOutfitBundles(
  products: any[],
  occasionId: string,
  maxBundles: number = 5
): Array<{
  name: string;
  items: any[];
  totalPrice: number;
  discount: number;
}> {
  const occasion = getOccasionById(occasionId);
  if (!occasion) return [];

  const bundles: Array<{ name: string; items: any[]; totalPrice: number; discount: number }> = [];

  // Group products by subcategory
  const grouped = products.reduce((acc, product) => {
    const category = product.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  // Create bundles by combining different categories
  const categories = Object.keys(grouped);
  let bundleCount = 0;

  for (let i = 0; i < categories.length && bundleCount < maxBundles; i++) {
    const bundle: any[] = [];
    let totalPrice = 0;

    // Add one item from each category
    for (const category of categories) {
      if (grouped[category].length > 0) {
        const item = grouped[category][0];
        bundle.push(item);
        totalPrice += item.price;
        grouped[category].shift();
      }
    }

    if (bundle.length >= 2) {
      const discount = bundle.length >= 3 ? 15 : 10;
      bundles.push({
        name: `${occasion.name} Outfit #${bundleCount + 1}`,
        items: bundle,
        totalPrice: Math.round(totalPrice * (1 - discount / 100)),
        discount,
      });
      bundleCount++;
    }
  }

  return bundles;
}

/**
 * Get trending occasions for current season
 */
export function getTrendingOccasions(): string[] {
  const month = new Date().getMonth() + 1; // 1-12

  // Pakistani wedding season: November - February
  if (month >= 11 || month <= 2) {
    return ['wedding', 'baraat', 'mehndi'];
  }

  // Eid varies, but typically has 2-3 per year
  if (month === 4 || month === 6 || month === 7) {
    return ['eid', 'casual', 'brunch'];
  }

  // Summer: June - August
  if (month >= 6 && month <= 8) {
    return ['casual', 'brunch', 'party'];
  }

  // Default
  return ['casual', 'office', 'party'];
}
