import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, Bot, User, Copy, Check, ShoppingBag, Tag } from 'lucide-react';
import { getProductImage, handleImageError } from '@/utils/productImage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  type: 'products' | 'brands' | 'product' | 'brand' | 'orders' | 'users' | null;
  products?: ProductCard[];
  brands?: BrandCard[];
  count?: number;
}

interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

// Simple AI to parse user intent and call appropriate MCP tool
function parseUserIntent(message: string): MCPToolCall | null {
  const lower = message.toLowerCase().trim();

  if (lower.includes('all products') || lower.includes('show products') || lower === 'products') {
    return { name: 'get_products', arguments: { limit: 50 } };
  }

  const brandMatch = lower.match(/brand[:\s]+(.+)/i);
  if (brandMatch || (lower.includes('products') && lower.includes('from'))) {
    const brand = brandMatch ? brandMatch[1].trim() : lower.replace(/.*from\s+/i, '').trim();
    return { name: 'get_products', arguments: { brand, limit: 50 } };
  }

  if (lower.includes('search') || lower.includes('find') || lower.includes('look for')) {
    const search = lower.replace(/.*(search|find|look for)\s+/i, '').trim();
    return { name: 'get_products', arguments: { search, limit: 50 } };
  }

  if (lower.includes('all brands') || lower.includes('show brands') || lower.includes('list brands')) {
    return { name: 'get_brands', arguments: { limit: 100 } };
  }

  if (lower.includes('search brand') || lower.includes('find brand')) {
    const search = lower.replace(/.*(search|find)\s+brand\s*/i, '').trim();
    return { name: 'get_brands', arguments: { search, limit: 50 } };
  }

  const brandSlugMatch = lower.match(/brand[:\s]+([\w-]+)/i);
  if (brandSlugMatch && !lower.includes('products')) {
    return { name: 'get_brand_by_slug', arguments: { slug: brandSlugMatch[1] } };
  }

  const productIdMatch = lower.match(/product[:\s]+(\w+)/i);
  if (productIdMatch) {
    return { name: 'get_product_by_id', arguments: { productId: productIdMatch[1] } };
  }

  if (lower.includes('orders') || lower.includes('recent orders')) {
    return { name: 'get_orders', arguments: { limit: 20 } };
  }

  if (lower.includes('users') || lower.includes('customers')) {
    return { name: 'get_users', arguments: { limit: 50 } };
  }

  return null;
}

// Parse API response into structured data for cards
function parseResponseData(toolName: string, data: any): { text: string; structured: ResponseData } {
  if (!data || data.error) {
    return { text: data?.error || 'No data returned', structured: { type: null } };
  }

  switch (toolName) {
    case 'get_products': {
      const products = data.products || data.items || [];
      if (products.length === 0) return { text: 'No products found.', structured: { type: 'products', products: [], count: 0 } };
      
      const structured: ResponseData = {
        type: 'products',
        count: data.count || products.length,
        products: products.map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          originalPrice: p.originalPrice,
          image: p.image || (p.images && p.images[0]),
          category: p.category,
          stock: p.stock,
        })),
      };

      return {
        text: `Found ${structured.count} product${structured.count !== 1 ? 's' : ''}`,
        structured,
      };
    }

    case 'get_product_by_id': {
      return {
        text: `**${data.name}**\nBrand: ${data.brand}\nPrice: $${data.price}\n${data.description || ''}`,
        structured: {
          type: 'product',
          products: [{
            id: data.id,
            name: data.name,
            brand: data.brand,
            price: data.price,
            originalPrice: data.originalPrice,
            image: data.image || (data.images && data.images[0]),
            category: data.category,
            stock: data.stock,
          }],
        },
      };
    }

    case 'get_brands': {
      const brands = data.brands || data.items || [];
      if (brands.length === 0) return { text: 'No brands found.', structured: { type: 'brands', brands: [], count: 0 } };
      
      const structured: ResponseData = {
        type: 'brands',
        count: data.count || brands.length,
        brands: brands.map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          description: b.description,
          productCount: b.productCount || 0,
          logo: b.logo,
          coverImage: b.coverImage,
        })),
      };

      return {
        text: `Found ${structured.count} brand${structured.count !== 1 ? 's' : ''}`,
        structured,
      };
    }

    case 'get_brand_by_slug': {
      return {
        text: `**${data.name}**\nProducts: ${data.productCount}\n${data.description || ''}`,
        structured: {
          type: 'brand',
          brands: [{
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            productCount: data.productCount,
            logo: data.logo,
            coverImage: data.coverImage,
          }],
        },
      };
    }

    case 'get_orders': {
      const orders = data.orders || data.items || [];
      if (orders.length === 0) return { text: 'No orders found.', structured: { type: 'orders' } };
      
      const text = orders.slice(0, 5).map((o: any) => 
        `Order #${o.orderNumber}\nCustomer: ${o.customerEmail}\nTotal: $${o.total}\nStatus: ${o.status}`
      ).join('\n\n');
      
      return { text: `Found ${data.count || orders.length} orders\n\n${text}`, structured: { type: 'orders' } };
    }

    case 'get_users': {
      const users = data.users || data.items || [];
      if (users.length === 0) return { text: 'No users found.', structured: { type: 'users' } };
      
      const text = users.slice(0, 10).map((u: any) => 
        `${u.name || u.email}\nRole: ${u.role}\nStatus: ${u.status}`
      ).join('\n\n');
      
      return { text: `Found ${data.count || users.length} users\n\n${text}`, structured: { type: 'users' } };
    }

    default:
      return { text: JSON.stringify(data, null, 2), structured: { type: null } };
  }
}

// Product Card Component
function ProductCardComponent({ product, onNavigate }: { product: ProductCard; onNavigate: (path: string) => void }) {
  return (
    <div
      onClick={() => onNavigate(`/product/${product.id}`)}
      className="group bg-white rounded-lg border border-gray-200 hover:border-gold/50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div className="aspect-[3/4] overflow-hidden bg-gray-50 relative">
        <img
          src={getProductImage(product as any)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => handleImageError(e, product.name)}
        />
        {product.stock !== undefined && product.stock < 10 && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            Low Stock
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
        <h4 className="font-medium text-sm text-gray-800 line-clamp-2 mb-2 group-hover:text-gold transition-colors">
          {product.name}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gold">${product.price}</span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">${product.originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Brand Card Component
function BrandCardComponent({ brand, onNavigate }: { brand: BrandCard; onNavigate: (path: string) => void }) {
  return (
    <div
      onClick={() => onNavigate(`/brands/${brand.slug}`)}
      className="group bg-white rounded-lg border border-gray-200 hover:border-gold/50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Cover Image */}
      <div className="h-24 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700 relative">
        {brand.coverImage && (
          <img src={brand.coverImage} alt={brand.name} className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        {/* Logo */}
        {brand.logo && (
          <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-full bg-white p-1 shadow-md">
            <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
          </div>
        )}
      </div>
      
      <div className="p-4 pt-8">
        <h4 className="font-semibold text-gray-800 group-hover:text-gold transition-colors">
          {brand.name}
        </h4>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <ShoppingBag className="w-3 h-3" />
          {brand.productCount} product{brand.productCount !== 1 ? 's' : ''}
        </p>
        {brand.description && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{brand.description}</p>
        )}
      </div>
    </div>
  );
}

export default function AIChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Hi! I'm your AI assistant. I can help you explore your Fashion Style store data.\n\nTry asking:\n• "Show all products"\n• "Products from Gul Ahmed"\n• "List all brands"\n• "Show recent orders"`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseCards, setResponseCards] = useState<ResponseData>({ type: null });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const callMCPTool = async (toolCall: MCPToolCall): Promise<{ text: string; structured: ResponseData }> => {
    try {
      // Direct API calls (fallback)
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
        case 'get_brands': {
          url = `${API_URL}/admin/brands?limit=${args.limit || 100}`;
          break;
        }
        case 'get_brand_by_slug': {
          const brandsRes = await fetch(`${API_URL}/admin/brands?limit=500`);
          const brandsData = await brandsRes.json();
          const brands = brandsData.brands || brandsData.items || [];
          const brand = brands.find((b: any) => b.slug === args.slug || b.name.toLowerCase() === (args.slug as string).toLowerCase());
          return parseResponseData('get_brand_by_slug', brand);
        }
        case 'get_orders': {
          url = `${API_URL}/admin/orders?limit=${args.limit || 20}`;
          break;
        }
        case 'get_users': {
          url = `${API_URL}/admin/users?limit=${args.limit || 50}`;
          break;
        }
        default:
          return { text: `Tool "${toolCall.name}" not available`, structured: { type: null } };
      }

      const res = await fetch(url);
      const data = await res.json();
      console.log(`📦 API returned: ${data.count || data.products?.length || 0} products`);
      return parseResponseData(toolCall.name, data);
    } catch (error) {
      return { text: `❌ Sorry, I couldn't fetch that data. Error: ${(error as Error).message}`, structured: { type: null } };
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setResponseCards({ type: null });

    try {
      const toolCall = parseUserIntent(userMessage.content);

      if (!toolCall) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I'm not sure I understood. Try asking:\n\n• "Show all products"\n• "Products from [brand name]"\n• "List all brands"\n• "Search for [keyword]"`,
            timestamp: new Date(),
          },
        ]);
      } else {
        const { text, structured } = await callMCPTool(toolCall);
        setResponseCards(structured);
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: text,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '❌ Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part
            )}
          </p>
        );
      }
      if (line.startsWith('• ')) {
        return <p key={i} className="ml-4 mb-1">{line}</p>;
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gold hover:bg-gold/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        title="AI Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex overflow-hidden" style={{ width: hasCards ? '900px' : '400px', maxWidth: 'calc(100vw - 2rem)', height: '600px', maxHeight: 'calc(100vh - 180px)' }}>
          {/* Left: Chat Panel */}
          <div className={`flex flex-col ${hasCards ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-gold to-gold/80 text-white px-6 py-4 flex items-center gap-3">
              <Bot className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-white/80">Powered by MCP Server</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-gold" />
                    </div>
                  )}

                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-gold text-white rounded-br-md'
                        : 'bg-white border border-gray-200 rounded-bl-md'
                    }`}>
                      <div className={msg.role === 'assistant' ? 'text-gray-800' : ''}>
                        {formatContent(msg.content)}
                      </div>
                    </div>

                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-1 ml-2">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <><Check className="w-3 h-3" /> Copied!</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-gold" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
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
                  placeholder="Ask about products, brands..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-gold text-white rounded-full hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Results Panel */}
          {hasCards && (
            <div className="w-1/2 bg-gray-50 flex flex-col">
              {/* Results Header */}
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
                <button
                  onClick={() => setResponseCards({ type: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cards Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Products */}
                {responseCards.type === 'products' && responseCards.products && (
                  <div className="grid grid-cols-2 gap-3">
                    {responseCards.products.slice(0, 20).map(product => (
                      <ProductCardComponent
                        key={product.id}
                        product={product}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                )}

                {/* Single Product */}
                {responseCards.type === 'product' && responseCards.products && (
                  <div className="grid grid-cols-1 gap-3">
                    {responseCards.products.map(product => (
                      <ProductCardComponent
                        key={product.id}
                        product={product}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                )}

                {/* Brands */}
                {responseCards.type === 'brands' && responseCards.brands && (
                  <div className="grid grid-cols-1 gap-3">
                    {responseCards.brands.slice(0, 15).map(brand => (
                      <BrandCardComponent
                        key={brand.id}
                        brand={brand}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                )}

                {/* Single Brand */}
                {responseCards.type === 'brand' && responseCards.brands && (
                  <div className="grid grid-cols-1 gap-3">
                    {responseCards.brands.map(brand => (
                      <BrandCardComponent
                        key={brand.id}
                        brand={brand}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                )}

                {/* Non-visual results */}
                {(responseCards.type === 'orders' || responseCards.type === 'users') && (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    Results shown in chat
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
