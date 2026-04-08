import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, Bot, User, Copy, Check, ShoppingBag, Tag, Lightbulb, History, Brain } from 'lucide-react';
import { getProductImage, handleImageError } from '@/utils/productImage';

// ===== TYPES =====
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ConversationContext {
  lastBrand?: string;
  lastCategory?: string;
  lastSearch?: string;
  lastTool?: string;
  lastCount?: number;
  turnCount: number;
  recentTopics: string[];
}

interface LearnedPreference {
  query: string;
  tool: string;
  args: Record<string, unknown>;
  frequency: number;
  lastUsed: Date;
}

interface ProductCard {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  stock?: number;
}

interface BrandCard {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount: number;
  logo?: string;
  coverImage?: string;
}

interface ResponseData {
  type: 'products' | 'brands' | 'product' | 'brand' | 'orders' | 'users' | 'stats' | null;
  products?: ProductCard[];
  brands?: BrandCard[];
  count?: number;
}

interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

// ===== CONSTANTS =====
const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';
const STORAGE_KEYS = {
  LEARNED: 'ai_chat_learned',
  CONTEXT: 'ai_chat_context',
  HISTORY: 'ai_chat_history',
};

// ===== AI INTELLIGENCE ENGINE =====
class AIChatEngine {
  private learnedPrefs: LearnedPreference[] = [];
  private context: ConversationContext = { turnCount: 0, recentTopics: [] };

  constructor() {
    this.loadLearnedData();
  }

  // Load learned preferences from localStorage
  private loadLearnedData() {
    try {
      const learned = localStorage.getItem(STORAGE_KEYS.LEARNED);
      if (learned) this.learnedPrefs = JSON.parse(learned);

      const ctx = localStorage.getItem(STORAGE_KEYS.CONTEXT);
      if (ctx) this.context = JSON.parse(ctx);
    } catch (e) {
      console.warn('Failed to load learned data');
    }
  }

  // Save learned preferences
  private saveLearnedData() {
    try {
      localStorage.setItem(STORAGE_KEYS.LEARNED, JSON.stringify(this.learnedPrefs.slice(-50)));
      localStorage.setItem(STORAGE_KEYS.CONTEXT, JSON.stringify(this.context));
    } catch (e) {
      console.warn('Failed to save learned data');
    }
  }

  // Learn from successful queries
  learn(query: string, toolCall: MCPToolCall) {
    const normalizedQuery = query.toLowerCase().trim();
    const existing = this.learnedPrefs.find(
      p => p.query === normalizedQuery || (p.args.brand === toolCall.arguments.brand)
    );

    if (existing) {
      existing.frequency++;
      existing.lastUsed = new Date();
    } else {
      this.learnedPrefs.push({
        query: normalizedQuery,
        tool: toolCall.name,
        args: toolCall.arguments,
        frequency: 1,
        lastUsed: new Date(),
      });
    }

    // Update context
    this.context.turnCount++;
    if (toolCall.arguments.brand) {
      this.context.lastBrand = toolCall.arguments.brand as string;
      this.addTopic(`brand: ${toolCall.arguments.brand}`);
    }
    if (toolCall.arguments.category) {
      this.context.lastCategory = toolCall.arguments.category as string;
      this.addTopic(`category: ${toolCall.arguments.category}`);
    }
    if (toolCall.arguments.search) {
      this.context.lastSearch = toolCall.arguments.search as string;
      this.addTopic(`search: ${toolCall.arguments.search}`);
    }
    this.context.lastTool = toolCall.name;

    this.saveLearnedData();
  }

  private addTopic(topic: string) {
    this.context.recentTopics = this.context.recentTopics.filter(t => t !== topic);
    this.context.recentTopics.push(topic);
    if (this.context.recentTopics.length > 10) {
      this.context.recentTopics.shift();
    }
  }

  // Get popular brands from learned data
  getPopularBrands(): string[] {
    const brandCounts: Record<string, number> = {};
    this.learnedPrefs.forEach(p => {
      if (p.args.brand) {
        const brand = p.args.brand as string;
        brandCounts[brand] = (brandCounts[brand] || 0) + p.frequency;
      }
    });

    return Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand]) => brand);
  }

  // Advanced intent parsing with context awareness
  parseIntent(message: string, context: ConversationContext): MCPToolCall | null {
    const lower = message.toLowerCase().trim();
    const cleaned = lower.replace(/[?!.]+$/g, '').trim();

    // ===== CONTEXT-AWARE FOLLOW-UPS =====
    // "show more", "next page", "next batch"
    if (cleaned.match(/^(show\s+more|next|load\s+more|more\s+please|continue)/)) {
      if (context.lastBrand) {
        return { name: 'get_products', arguments: { brand: context.lastBrand, limit: 50 } };
      }
      if (context.lastCategory) {
        return { name: 'get_products', arguments: { category: context.lastCategory, limit: 50 } };
      }
      return { name: 'get_products', arguments: { limit: 50 } };
    }

    // "cheapest", "most expensive", "sort by price"
    if (cleaned.includes('cheap') || cleaned.includes('low') || cleaned.includes('expensive') || cleaned.includes('high')) {
      if (context.lastBrand) {
        return { name: 'get_products', arguments: { brand: context.lastBrand, limit: 100 } };
      }
      return { name: 'get_products', arguments: { limit: 100 } };
    }

    // ===== BRAND DETECTION (Enhanced) =====
    // Direct brand mention: "Maria B", "Gul Ahmed", "Dhaga"
    const brandPatterns = [
      /(?:products?|items?|clothes?|dresses?|suits?)\s+(?:from|by|of)\s+(.+)/i,
      /(?:show|get|find|list|display)\s+(.+\s+(?:products?|items?|collection))/i,
      /^(.+)(?:'s|s)\s+(?:products?|collection|items?|dresses?|suits?)/i,
      /(?:brand|designer)\s*(?::|=|is)\s*(.+)/i,
    ];

    for (const pattern of brandPatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let brand = match[1].trim();
        // Clean up common noise words
        brand = brand.replace(/\s+(products?|items?|clothes?|collection|dresses?|suits?)$/i, '').trim();
        if (brand.length > 0) {
          return { name: 'get_products', arguments: { brand, limit: 50 } };
        }
      }
    }

    // "from [brand]" pattern
    const fromMatch = cleaned.match(/from\s+([a-z][a-z\s&'-]+)/i);
    if (fromMatch && !cleaned.includes('from the') && !cleaned.includes('from all')) {
      return { name: 'get_products', arguments: { brand: fromMatch[1].trim(), limit: 50 } };
    }

    // ===== CATEGORY DETECTION =====
    const categories = ['bridal', 'casual', 'formal', 'lawn', 'luxury', 'pret', 'unstitched', 'kids', 'men', 'women'];
    for (const cat of categories) {
      if (cleaned.includes(cat)) {
        return { name: 'get_products', arguments: { category: cat, limit: 50 } };
      }
    }

    // ===== SEARCH KEYWORD =====
    if (cleaned.match(/^(search|find|look\s*for|show\s+me)/)) {
      const search = cleaned.replace(/^(search|find|look\s*for|show\s+me)\s*/i, '').trim();
      if (search.length > 0) {
        return { name: 'get_products', arguments: { search, limit: 50 } };
      }
    }

    // ===== BRANDS LIST =====
    if (cleaned.match(/^(show|list|get|display)\s*(all\s*)?brands?/)) {
      return { name: 'get_brands', arguments: { limit: 100 } };
    }

    // ===== SINGLE BRAND =====
    if (cleaned.match(/^(tell\s*me\s*about|info\s*on|about)\s+(.+)/)) {
      const name = cleaned.replace(/^(tell\s*me\s*about|info\s*on|about)\s+/, '').trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return { name: 'get_brand_by_slug', arguments: { slug } };
    }

    // ===== SINGLE PRODUCT =====
    const prodMatch = cleaned.match(/product\s*#?(\w+)/i);
    if (prodMatch) {
      return { name: 'get_product_by_id', arguments: { productId: prodMatch[1] } };
    }

    // ===== ORDERS =====
    if (cleaned.includes('order')) {
      return { name: 'get_orders', arguments: { limit: 20 } };
    }

    // ===== USERS =====
    if (cleaned.match(/(users?|customers?|people)/)) {
      return { name: 'get_users', arguments: { limit: 50 } };
    }

    // ===== ALL PRODUCTS =====
    if (cleaned.match(/^(show|get|list|display|all)\s*(all\s*)?(products?|items?)/)) {
      return { name: 'get_products', arguments: { limit: 50 } };
    }

    // ===== GREETING =====
    if (cleaned.match(/^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings|howdy)/)) {
      return { name: 'greeting', arguments: {} };
    }

    // ===== HELP =====
    if (cleaned.match(/^(help|what\s*can\s*you\s*do|commands|options)/)) {
      return { name: 'help', arguments: {} };
    }

    // ===== STATS =====
    if (cleaned.includes('stats') || cleaned.includes('summary') || cleaned.includes('overview')) {
      return { name: 'get_stats', arguments: {} };
    }

    // Default: try to extract brand/entity from the message
    if (cleaned.length > 2 && cleaned.length < 50 && !cleaned.includes(' ')) {
      // Single word - might be a brand
      return { name: 'get_products', arguments: { brand: cleaned, limit: 50 } };
    }

    return null;
  }

  // Generate smart suggestions based on context
  getSuggestions(context: ConversationContext, lastResult: ResponseData): string[] {
    const suggestions: string[] = [];

    if (lastResult.type === 'products' && lastResult.count && lastResult.count > 0) {
      if (context.lastBrand) {
        suggestions.push(`Show more ${context.lastBrand} products`);
        suggestions.push(`Cheapest ${context.lastBrand}`);
      }
      suggestions.push('Show all brands');
      suggestions.push('Show products by category');
    } else if (lastResult.type === 'brands') {
      suggestions.push('Show all products');
      if (lastResult.brands && lastResult.brands.length > 0) {
        suggestions.push(`Show ${lastResult.brands[0].name} products`);
      }
    } else if (context.turnCount === 0) {
      // Initial suggestions
      suggestions.push('Show all products');
      suggestions.push('List all brands');
      suggestions.push('Show recent orders');
      suggestions.push('Help');
    }

    return suggestions.slice(0, 4);
  }
}

// ===== GLOBAL ENGINE INSTANCE =====
const aiEngine = new AIChatEngine();

// ===== API FUNCTIONS =====
async function callMCPTool(toolCall: MCPToolCall): Promise<{ text: string; structured: ResponseData }> {
  try {
    let url = '';
    const args = toolCall.arguments;

    switch (toolCall.name) {
      case 'get_products': {
        const params = new URLSearchParams();
        if (args.brand) params.append('brand', args.brand as string);
        if (args.category) params.append('category', args.category as string);
        if (args.search) params.append('search', args.search as string);
        if (args.limit) params.append('limit', String(args.limit));
        url = `${API_URL}/products?${params.toString()}`;
        break;
      }
      case 'get_product_by_id':
        url = `${API_URL}/products/${args.productId}`;
        break;
      case 'get_brands':
        url = `${API_URL}/admin/brands?limit=${args.limit || 100}`;
        break;
      case 'get_brand_by_slug': {
        const brandsRes = await fetch(`${API_URL}/admin/brands?limit=500`);
        const brandsData = await brandsRes.json();
        const brands = brandsData.brands || brandsData.items || [];
        const brand = brands.find((b: any) => b.slug === args.slug || b.name.toLowerCase() === (args.slug as string).toLowerCase());
        return parseResponseData('get_brand_by_slug', brand);
      }
      case 'get_orders':
        url = `${API_URL}/admin/orders?limit=${args.limit || 20}`;
        break;
      case 'get_users':
        url = `${API_URL}/admin/users?limit=${args.limit || 50}`;
        break;
      default:
        return { text: `Tool "${toolCall.name}" not available`, structured: { type: null } };
    }

    const res = await fetch(url);
    const data = await res.json();
    return parseResponseData(toolCall.name, data);
  } catch (error) {
    return { text: `❌ Sorry, I couldn't fetch that data. Error: ${(error as Error).message}`, structured: { type: null } };
  }
}

function parseResponseData(toolName: string, data: any): { text: string; structured: ResponseData } {
  if (!data || data.error) {
    return { text: data?.error || 'No data returned', structured: { type: null } };
  }

  switch (toolName) {
    case 'get_products': {
      const products = data.products || data.items || [];
      if (products.length === 0) return { text: 'No products found.', structured: { type: 'products', products: [], count: 0 } };

      return {
        text: `Found **${data.count || products.length}** product${data.count !== 1 ? 's' : ''}`,
        structured: {
          type: 'products',
          count: data.count || products.length,
          products: products.map((p: any) => ({
            id: p.id, name: p.name, brand: p.brand, price: p.price,
            originalPrice: p.originalPrice,
            image: p.image || (p.images && p.images[0]),
            category: p.category, stock: p.stock,
          })),
        },
      };
    }

    case 'get_product_by_id': {
      return {
        text: `**${data.name}**\nBrand: ${data.brand}\nCategory: ${data.category}\nPrice: $${data.price}\nStock: ${data.stock}\n\n${data.description || ''}`,
        structured: {
          type: 'product',
          products: [{
            id: data.id, name: data.name, brand: data.brand, price: data.price,
            originalPrice: data.originalPrice,
            image: data.image || (data.images && data.images[0]),
            category: data.category, stock: data.stock,
          }],
        },
      };
    }

    case 'get_brands': {
      const brands = data.brands || data.items || [];
      if (brands.length === 0) return { text: 'No brands found.', structured: { type: 'brands', brands: [], count: 0 } };

      return {
        text: `Found **${data.count || brands.length}** brand${data.count !== 1 ? 's' : ''}`,
        structured: {
          type: 'brands',
          count: data.count || brands.length,
          brands: brands.map((b: any) => ({
            id: b.id, name: b.name, slug: b.slug, description: b.description,
            productCount: b.productCount || 0, logo: b.logo, coverImage: b.coverImage,
          })),
        },
      };
    }

    case 'get_brand_by_slug': {
      if (!data) return { text: 'Brand not found', structured: { type: null } };
      return {
        text: `**${data.name}**\nProducts: ${data.productCount}\n${data.description || ''}`,
        structured: {
          type: 'brand',
          brands: [{
            id: data.id, name: data.name, slug: data.slug, description: data.description,
            productCount: data.productCount, logo: data.logo, coverImage: data.coverImage,
          }],
        },
      };
    }

    case 'get_orders': {
      const orders = data.orders || data.items || [];
      if (orders.length === 0) return { text: 'No orders found.', structured: { type: 'orders' } };
      const text = orders.slice(0, 5).map((o: any) =>
        `**Order #${o.orderNumber}**\nCustomer: ${o.customerEmail}\nTotal: $${o.total}\nStatus: ${o.status}`
      ).join('\n\n');
      return { text: `Found **${data.count || orders.length}** orders\n\n${text}`, structured: { type: 'orders' } };
    }

    case 'get_users': {
      const users = data.users || data.items || [];
      if (users.length === 0) return { text: 'No users found.', structured: { type: 'users' } };
      const text = users.slice(0, 10).map((u: any) =>
        `**${u.name || u.email}**\nRole: ${u.role}\nStatus: ${u.status}`
      ).join('\n\n');
      return { text: `Found **${data.count || users.length}** users\n\n${text}`, structured: { type: 'users' } };
    }

    default:
      return { text: JSON.stringify(data, null, 2), structured: { type: null } };
  }
}

// ===== COMPONENTS =====
function ProductCardComponent({ product, onNavigate }: { product: ProductCard; onNavigate: (path: string) => void }) {
  return (
    <div onClick={() => onNavigate(`/product/${product.id}`)} className="group bg-white rounded-lg border border-gray-200 hover:border-gold/50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
      <div className="aspect-[3/4] overflow-hidden bg-gray-50 relative">
        <img src={getProductImage(product as any)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => handleImageError(e, product.name)} />
        {product.stock !== undefined && product.stock < 10 && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">Low Stock</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
        <h4 className="font-medium text-sm text-gray-800 line-clamp-2 mb-2 group-hover:text-gold transition-colors">{product.name}</h4>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gold">${product.price}</span>
          {product.originalPrice && <span className="text-xs text-gray-400 line-through">${product.originalPrice}</span>}
        </div>
      </div>
    </div>
  );
}

function BrandCardComponent({ brand, onNavigate }: { brand: BrandCard; onNavigate: (path: string) => void }) {
  return (
    <div onClick={() => onNavigate(`/brands/${brand.slug}`)} className="group bg-white rounded-lg border border-gray-200 hover:border-gold/50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
      <div className="h-24 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700 relative">
        {brand.coverImage && <img src={brand.coverImage} alt={brand.name} className="w-full h-full object-cover opacity-60" />}
        <div className="absolute inset-0 bg-black/30" />
        {brand.logo && (
          <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-full bg-white p-1 shadow-md">
            <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
          </div>
        )}
      </div>
      <div className="p-4 pt-8">
        <h4 className="font-semibold text-gray-800 group-hover:text-gold transition-colors">{brand.name}</h4>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <ShoppingBag className="w-3 h-3" />{brand.productCount} product{brand.productCount !== 1 ? 's' : ''}
        </p>
        {brand.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{brand.description}</p>}
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function AIChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Hi! I'm your **AI Assistant** with learning capabilities.\n\nI can help you with:\n• 🛍️ **Products** - Search, filter by brand, category\n• 🏷️ **Brands** - Browse all brands\n• 📦 **Orders** - View recent orders\n• 👥 **Users** - See customer list\n\nTry asking:\n• "Show Maria B products"\n• "List all brands"\n• "Recent orders"`,
      timestamp: new Date(),
      suggestions: ['Show all products', 'List all brands', 'Show recent orders', 'Help'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseCards, setResponseCards] = useState<ResponseData>({ type: null });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setIsOpen(false);
  }, [navigate]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setResponseCards({ type: null });

    try {
      // Parse intent with context awareness
      const toolCall = aiEngine.parseIntent(messageText, {
        turnCount: messages.filter(m => m.role === 'user').length,
        recentTopics: [],
      });

      if (!toolCall) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I didn't understand that. Here's what I can do:\n\n🛍️ **Products**: "Show Maria B products", "Lawn collection"\n🏷️ **Brands**: "List all brands", "About Gul Ahmed"\n📦 **Orders**: "Show recent orders"\n👥 **Users**: "Show customers"\n\n💡 Tip: Mention brand names like "Maria B", "Gul Ahmed", "Dhaga"`,
          timestamp: new Date(),
          suggestions: ['Show all products', 'List all brands', 'Help'],
        }]);
      } else if (toolCall.name === 'greeting') {
        const popularBrands = aiEngine.getPopularBrands();
        const brandText = popularBrands.length > 0 ? `\n\n🔥 **Popular brands you've searched:** ${popularBrands.join(', ')}` : '';
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `👋 Hello! I'm your AI shopping assistant.${brandText}\n\nWhat would you like to explore today?`,
          timestamp: new Date(),
          suggestions: ['Show all products', 'List all brands', ...popularBrands.slice(0, 2).map(b => `${b} products`)],
        }]);
      } else if (toolCall.name === 'help') {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🤖 **AI Assistant Commands:**\n\n🛍️ **Products:**\n• "Show all products"\n• "Maria B products"\n• "Products from Gul Ahmed"\n• "Search embroidered"\n• "Show lawn collection"\n\n🏷️ **Brands:**\n• "List all brands"\n• "About [brand name]"\n\n📦 **Orders & Users:**\n• "Recent orders"\n• "Show customers"\n\n💡 **Smart Features:**\n• I learn from your queries\n• I remember your preferences\n• I suggest related searches\n• I understand follow-ups like "show more"`,
          timestamp: new Date(),
          suggestions: ['Show all products', 'List all brands', 'Show recent orders'],
        }]);
      } else {
        // Execute tool call
        const { text, structured } = await callMCPTool(toolCall);

        // Learn from this interaction
        aiEngine.learn(messageText, toolCall);

        // Generate smart suggestions
        const suggestions = aiEngine.getSuggestions(
          { turnCount: messages.filter(m => m.role === 'user').length, recentTopics: [] },
          structured
        );

        setResponseCards(structured);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: text,
          timestamp: new Date(),
          suggestions,
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleCopy = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <p key={i} className="mb-1">
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part)}
          </p>
        );
      }
      if (line.startsWith('• ')) return <p key={i} className="ml-4 mb-1">{line}</p>;
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="mb-1">{line}</p>;
    });
  };

  const hasCards = responseCards.type === 'products' || responseCards.type === 'brands' ||
                   responseCards.type === 'product' || responseCards.type === 'brand';

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        title="AI Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex overflow-hidden" style={{ width: hasCards ? '900px' : '420px', maxWidth: 'calc(100vw - 2rem)', height: '650px', maxHeight: 'calc(100vh - 180px)' }}>
          {/* Left: Chat Panel */}
          <div className={`flex flex-col ${hasCards ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-gold to-gold/80 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="w-6 h-6" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> Powered by MCP • Learning enabled
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Chat history"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-gold" />
                    </div>
                  )}

                  <div className={`max-w-[85%]`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-gold to-gold/90 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 rounded-bl-md shadow-sm'
                    }`}>
                      <div className={msg.role === 'assistant' ? 'text-gray-800' : ''}>
                        {formatContent(msg.content)}
                      </div>
                    </div>

                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(suggestion)}
                            className="px-3 py-1.5 bg-white border border-gold/30 text-gold text-xs rounded-full hover:bg-gold/10 transition-colors flex items-center gap-1"
                          >
                            <Lightbulb className="w-3 h-3" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Copy button */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-1 ml-2">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          {copiedId === msg.id ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold/90 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-gold" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gold" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about products, brands..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-gradient-to-br from-gold to-gold/90 text-white rounded-full hover:from-gold/90 hover:to-gold/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Results Panel */}
          {hasCards && (
            <div className="w-1/2 bg-gray-50 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {responseCards.type?.includes('product') ? (
                    <ShoppingBag className="w-4 h-4 text-gold" />
                  ) : (
                    <Tag className="w-4 h-4 text-gold" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {responseCards.count ? `${responseCards.count} Results` : 'Results'}
                  </span>
                </div>
                <button onClick={() => setResponseCards({ type: null })} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {responseCards.type === 'products' && responseCards.products && (
                  <div className="grid grid-cols-2 gap-3">
                    {responseCards.products.slice(0, 20).map(product => (
                      <ProductCardComponent key={product.id} product={product} onNavigate={handleNavigate} />
                    ))}
                  </div>
                )}

                {responseCards.type === 'product' && responseCards.products && (
                  <div className="grid grid-cols-1 gap-3">
                    {responseCards.products.map(product => (
                      <ProductCardComponent key={product.id} product={product} onNavigate={handleNavigate} />
                    ))}
                  </div>
                )}

                {responseCards.type === 'brands' && responseCards.brands && (
                  <div className="grid grid-cols-1 gap-3">
                    {responseCards.brands.slice(0, 15).map(brand => (
                      <BrandCardComponent key={brand.id} brand={brand} onNavigate={handleNavigate} />
                    ))}
                  </div>
                )}

                {responseCards.type === 'brand' && responseCards.brands && (
                  <div className="grid grid-cols-1 gap-3">
                    {responseCards.brands.map(brand => (
                      <BrandCardComponent key={brand.id} brand={brand} onNavigate={handleNavigate} />
                    ))}
                  </div>
                )}

                {(responseCards.type === 'orders' || responseCards.type === 'users') && (
                  <div className="text-center py-12 text-gray-500 text-sm">Results shown in chat</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
