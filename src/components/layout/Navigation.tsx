import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';
import { ShoppingBag, Menu, X, Search, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { getProductUrl } from '@/utils/productUrl';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const { items, totalItems, totalPrice, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const normalize = (value: unknown) =>
    String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const filteredProducts = useMemo(() => {
    const query = normalize(searchQuery);
    if (query.length < 2) return [];

    return allProducts.filter((product) => {
      const name = normalize(product?.name);
      const brand = normalize(product?.brand);
      const category = normalize(product?.category);
      const id = normalize(product?.id);
      const pk = normalize(product?.PK);
      return (
        name.includes(query) ||
        brand.includes(query) ||
        category.includes(query) ||
        id.includes(query) ||
        pk.includes(query)
      );
    });
  }, [allProducts, searchQuery]);

  const filteredBrands = useMemo(() => {
    const query = normalize(searchQuery);
    if (query.length < 2) return [];

    return Array.from(
      new Set(
        allProducts
          .map((p) => p?.brand)
          .filter(Boolean)
          .filter((brand) => normalize(brand).includes(query))
      )
    );
  }, [allProducts, searchQuery]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!showSearch || allProducts.length > 0) return;

    let isMounted = true;

    const fetchAllProducts = async () => {
      try {
        setIsSearchLoading(true);
        const items: any[] = [];
        let nextToken: string | undefined;

        do {
          const data = await api.listProducts(nextToken ? { nextToken } : {});
          if (Array.isArray(data?.items)) {
            items.push(...data.items);
          }

          nextToken =
            data?.nextToken ||
            data?.lastEvaluatedKey ||
            data?.LastEvaluatedKey ||
            data?.paginationToken;
        } while (nextToken);

        if (isMounted) {
          setAllProducts(items);
        }
      } catch (error) {
        console.error('Failed to load search products:', error);
      } finally {
        if (isMounted) {
          setIsSearchLoading(false);
        }
      }
    };

    fetchAllProducts();

    return () => {
      isMounted = false;
    };
  }, [showSearch, allProducts.length]);

  const checkAuth = async () => {
    try {
      await getCurrentUser();
      setIsLoggedIn(true);
    } catch {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Brands', href: '/brands' },
    { name: 'Collection', href: '/#featured' },
    { name: 'Virtual Try-On', href: '/try-on' },
    { name: 'New Arrivals', href: '/#new-arrivals' },
    { name: 'About', href: '/#about' },
  ];

  return (
    <>
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className={`font-playfair text-2xl md:text-3xl font-semibold tracking-tight transition-colors duration-300 ${
              isScrolled ? 'text-black' : 'text-white'
            }`}>
              Noor
            </span>
            <span className={`font-dancing text-lg md:text-xl transition-colors duration-300 ${
              isScrolled ? 'text-gold' : 'text-white/90'
            }`}>
              by Faisal
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.href.startsWith('/#')) {
                    e.preventDefault();
                    const id = link.href.substring(2);
                    const element = document.getElementById(id);
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`text-sm font-medium tracking-wide underline-animation transition-colors duration-300 ${
                  isScrolled ? 'text-black' : 'text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setShowSearch(true)}
              className={`p-2 rounded-full transition-all duration-300 hover:bg-black/5 ${
                isScrolled ? 'text-black' : 'text-white'
              }`}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
              className={`hidden md:block p-2 rounded-full transition-all duration-300 hover:bg-black/5 ${
                isScrolled ? 'text-black' : 'text-white'
              }`}
              aria-label="Account"
              title={isLoggedIn ? 'My Dashboard' : 'Login'}
            >
              <User className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <button
                  className={`relative p-2 rounded-full transition-all duration-300 hover:bg-black/5 ${
                    isScrolled ? 'text-black' : 'text-white'
                  }`}
                  aria-label="Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-white text-xs font-medium rounded-full flex items-center justify-center animate-scale-in">
                      {totalItems}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white">
                <SheetHeader>
                  <SheetTitle className="font-playfair text-2xl">Shopping Cart</SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col h-[calc(100vh-180px)]">
                  {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">Your cart is empty</p>
                      <p className="text-sm text-gray-400 mt-1">Add some items to get started</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto space-y-4 pr-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-4 p-3 bg-beige-50 rounded-lg"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-24 object-cover rounded-md"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-gold font-semibold mt-1">
                                ${item.price}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-4 mt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-playfair text-xl font-semibold">
                            ${totalPrice.toFixed(2)}
                          </span>
                        </div>
                        <Button 
                          onClick={() => {
                            setIsCartOpen(false);
                            navigate('/checkout');
                          }}
                          className="w-full bg-black text-white hover:bg-gray-800 rounded-full py-6"
                        >
                          Proceed to Checkout
                        </Button>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="w-full text-center text-sm text-gray-500 hover:text-black transition-colors"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-full transition-all duration-300 hover:bg-black/5 ${
                isScrolled ? 'text-black' : 'text-white'
              }`}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-500 ${
            isMobileMenuOpen ? 'max-h-96 mt-4' : 'max-h-0'
          }`}
        >
          <div className={`py-4 space-y-3 ${isScrolled ? 'bg-white' : 'bg-black/20 backdrop-blur-md'} rounded-lg px-4`}>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium ${
                  isScrolled ? 'text-black' : 'text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>

    {showSearch && (
      <div className="fixed inset-0 bg-white z-[100] overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="w-full">
            <div className="relative mb-8">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or brands..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                autoFocus
              />
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {searchQuery.length >= 2 && (
              <div className="space-y-8">
                {filteredBrands.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Brands ({filteredBrands.length})</h3>
                    <div className="flex flex-wrap gap-3">
                      {filteredBrands.map((brand) => (
                        <button
                          key={brand}
                          onClick={() => {
                            navigate(`/brand/${encodeURIComponent(String(brand))}`);
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                          className="px-4 py-2 bg-beige-50 hover:bg-beige-100 rounded-full text-sm"
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredProducts.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Products ({filteredProducts.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                      {filteredProducts.map((product: any) => (
                        <div
                          key={product.id || product.PK}
                          onClick={() => {
                            navigate(getProductUrl(product));
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                          className="p-3 bg-beige-50 rounded-lg cursor-pointer hover:shadow-lg transition"
                        >
                          <div className="relative w-full h-72 rounded overflow-hidden bg-gray-100">
                            <img 
                              src={product.images?.[0] || product.image || '/product-1.jpg'} 
                              alt={product.name} 
                              className="absolute inset-0 w-full h-full object-contain object-center p-1" 
                            />
                          </div>
                          <div className="mt-2">
                            <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                            <p className="text-xs text-gray-500">ID: {product.id || product.PK}</p>
                            <p className="text-xs text-gray-600 truncate">{product.brand || product.category}</p>
                            <p className="text-gold font-semibold mt-1">${product.basePrice || product.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!isSearchLoading && filteredProducts.length === 0 && filteredBrands.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No results found for "{searchQuery}"</p>
                )}

                {isSearchLoading && (
                  <p className="text-center text-gray-500 py-8">Searching...</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
