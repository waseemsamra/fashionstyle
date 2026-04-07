import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

// Available MCP tools and their descriptions for the AI
const MCP_TOOLS = [
  {
    name: 'get_products',
    description: 'Fetch all products or search by brand, category, or keyword',
    parameters: { brand: 'string', category: 'string', search: 'string', limit: 'number' },
  },
  {
    name: 'get_product_by_id',
    description: 'Get a single product by its ID',
    parameters: { productId: 'string' },
  },
  {
    name: 'get_brands',
    description: 'Fetch all brands or search by name',
    parameters: { search: 'string', featured: 'boolean', limit: 'number' },
  },
  {
    name: 'get_brand_by_slug',
    description: 'Get a brand by its slug',
    parameters: { slug: 'string' },
  },
  {
    name: 'get_orders',
    description: 'Fetch orders with optional filters',
    parameters: { status: 'string', limit: 'number' },
  },
  {
    name: 'get_users',
    description: 'Fetch all registered users',
    parameters: { limit: 'number' },
  },
];

// Simple AI to parse user intent and call appropriate MCP tool
function parseUserIntent(message: string): MCPToolCall | null {
  const lower = message.toLowerCase().trim();

  // Get all products
  if (lower.includes('all products') || lower.includes('show products') || lower === 'products') {
    return { name: 'get_products', arguments: { limit: 50 } };
  }

  // Search products by brand
  const brandMatch = lower.match(/brand[:\s]+(.+)/i);
  if (brandMatch || (lower.includes('products') && lower.includes('from'))) {
    const brand = brandMatch ? brandMatch[1].trim() : lower.replace(/.*from\s+/i, '').trim();
    return { name: 'get_products', arguments: { brand, limit: 50 } };
  }

  // Search products by keyword
  if (lower.includes('search') || lower.includes('find') || lower.includes('look for')) {
    const search = lower.replace(/.*(search|find|look for)\s+/i, '').trim();
    return { name: 'get_products', arguments: { search, limit: 50 } };
  }

  // Get brands
  if (lower.includes('all brands') || lower.includes('show brands') || lower.includes('list brands')) {
    return { name: 'get_brands', arguments: { limit: 100 } };
  }

  // Search brands
  if (lower.includes('search brand') || lower.includes('find brand')) {
    const search = lower.replace(/.*(search|find)\s+brand\s*/i, '').trim();
    return { name: 'get_brands', arguments: { search, limit: 50 } };
  }

  // Get brand by slug
  const brandSlugMatch = lower.match(/brand[:\s]+([\w-]+)/i);
  if (brandSlugMatch && !lower.includes('products')) {
    return { name: 'get_brand_by_slug', arguments: { slug: brandSlugMatch[1] } };
  }

  // Get product by ID
  const productIdMatch = lower.match(/product[:\s]+(\w+)/i);
  if (productIdMatch) {
    return { name: 'get_product_by_id', arguments: { productId: productIdMatch[1] } };
  }

  // Get orders
  if (lower.includes('orders') || lower.includes('recent orders')) {
    return { name: 'get_orders', arguments: { limit: 20 } };
  }

  // Get users
  if (lower.includes('users') || lower.includes('customers')) {
    return { name: 'get_users', arguments: { limit: 50 } };
  }

  return null;
}

// Format API response into readable text
function formatResponse(toolName: string, data: any): string {
  if (!data || data.error) {
    return data?.error || 'No data returned';
  }

  switch (toolName) {
    case 'get_products': {
      const products = data.products || [];
      if (products.length === 0) return 'No products found.';
      return `Found ${data.count || products.length} products:\n\n${products
        .slice(0, 10)
        .map((p: any) => `• **${p.name}**\n  Brand: ${p.brand}\n  Price: $${p.price}\n  Stock: ${p.stock}`)
        .join('\n\n')}${products.length > 10 ? `\n\n...and ${products.length - 10} more` : ''}`;
    }

    case 'get_product_by_id': {
      return `**Product Details:**\n\n` +
        `Name: ${data.name}\n` +
        `Brand: ${data.brand}\n` +
        `Category: ${data.category}\n` +
        `Price: $${data.price}\n` +
        `Stock: ${data.stock}\n` +
        `Description: ${data.description}\n` +
        `Sizes: ${data.sizes?.join(', ')}\n` +
        `Colors: ${data.colors?.join(', ')}`;
    }

    case 'get_brands': {
      const brands = data.brands || [];
      if (brands.length === 0) return 'No brands found.';
      return `Found ${data.count || brands.length} brands:\n\n${brands
        .slice(0, 15)
        .map((b: any) => `• **${b.name}** (${b.productCount || 0} products)`)
        .join('\n')}${brands.length > 15 ? `\n\n...and ${brands.length - 15} more` : ''}`;
    }

    case 'get_brand_by_slug': {
      return `**Brand: ${data.name}**\n\n` +
        `Slug: ${data.slug}\n` +
        `Products: ${data.productCount}\n` +
        `Featured: ${data.isFeatured ? 'Yes' : 'No'}\n` +
        `Description: ${data.description || 'N/A'}`;
    }

    case 'get_orders': {
      const orders = data.orders || [];
      if (orders.length === 0) return 'No orders found.';
      return `Found ${data.count || orders.length} orders:\n\n${orders
        .slice(0, 10)
        .map((o: any) => `• Order #${o.orderNumber}\n  Customer: ${o.customerEmail}\n  Total: $${o.total}\n  Status: ${o.status}`)
        .join('\n\n')}`;
    }

    case 'get_users': {
      const users = data.users || [];
      if (users.length === 0) return 'No users found.';
      return `Found ${data.count || users.length} users:\n\n${users
        .slice(0, 10)
        .map((u: any) => `• ${u.name || u.email}\n  Role: ${u.role}\n  Status: ${u.status}`)
        .join('\n\n')}`;
    }

    default:
      return JSON.stringify(data, null, 2);
  }
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Hi! I'm your AI assistant. I can help you explore your Fashion Style store data.\n\nTry asking:\n• "Show all products"\n• "Products from Gul Ahmed"\n• "List all brands"\n• "Show recent orders"\n• "Show users"`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const callMCPTool = async (toolCall: MCPToolCall): Promise<string> => {
    try {
      const endpoint = `/api/mcp/${toolCall.name}`;
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toolCall.arguments),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return formatResponse(toolCall.name, data);
    } catch (error) {
      console.error('MCP tool call failed:', error);
      // Fallback: call the actual API endpoint directly
      try {
        let url = '';
        const args = toolCall.arguments;

        switch (toolCall.name) {
          case 'get_products': {
            const params = new URLSearchParams();
            if (args.brand) params.append('brand', args.brand as string);
            if (args.category) params.append('category', args.category as string);
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
            const brand = brands.find((b: any) => b.slug === args.slug);
            return brand ? formatResponse('get_brand_by_slug', brand) : `Brand "${args.slug}" not found`;
          }
          default:
            return `Tool "${toolCall.name}" not available in direct mode`;
        }

        const res = await fetch(url);
        const data = await res.json();
        return formatResponse(toolCall.name, data);
      } catch (fallbackError) {
        return `❌ Sorry, I couldn't fetch that data. Error: ${(fallbackError as Error).message}`;
      }
    }
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

    try {
      const toolCall = parseUserIntent(userMessage.content);

      if (!toolCall) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I'm not sure I understood. Try asking:\n\n• "Show all products"\n• "Products from [brand name]"\n• "List all brands"\n• "Search for [keyword]"\n• "Show recent orders"`,
            timestamp: new Date(),
          },
        ]);
      } else {
        const response = await callMCPTool(toolCall);
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
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

  // Simple markdown-like formatting
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold text
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
      // Bullet points
      if (line.startsWith('• ')) {
        return (
          <p key={i} className="ml-4 mb-1">
            {line}
          </p>
        );
      }
      // Empty lines
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // Regular text
      return <p key={i} className="mb-1">{line}</p>;
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gold hover:bg-gold/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        title="AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '600px', maxHeight: 'calc(100vh - 180px)' }}>
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
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-gold" />
                  </div>
                )}

                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-gold text-white rounded-br-md'
                        : 'bg-white border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    <div className={msg.role === 'assistant' ? 'text-gray-800' : ''}>
                      {formatContent(msg.content)}
                    </div>
                  </div>

                  {/* Message Actions */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1 ml-2">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
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
                placeholder="Ask about products, brands, orders..."
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
      )}
    </>
  );
}
