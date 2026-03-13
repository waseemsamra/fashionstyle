import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, ArrowLeft, Save, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

export default function DesignersDiscountCMS() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'brands' | 'products'>('brands');
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.listProducts();
      const productsArray = Array.isArray(data) ? data : (data.items || data.products || data.data || []);
      
      // Get all unique brands
      const uniqueBrands = [...new Set(productsArray.map((p: any) => p.brand).filter(Boolean))] as string[];
      setAllBrands(uniqueBrands);
      setProducts(productsArray);
      
      // Get currently selected brands and products
      const discountProducts = productsArray.filter((p: any) => p.isDesignersDiscount);
      const selectedBrandSet = new Set(discountProducts.map((p: any) => p.brand) as string[]);
      setSelectedBrands([...selectedBrandSet]);
      setSelectedProductIds(discountProducts.map((p: any) => p.id));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= 8) {
          alert('You can only select up to 8 products');
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        alert('Please login as admin first');
        navigate('/admin/login');
        return;
      }
      
      console.log('📝 Starting save with', selectedProductIds.length, 'products from', selectedBrands.length, 'brands');
      
      // Update all products
      const updatePromises = products.map(async (product: any) => {
        const shouldFlag = selectedProductIds.includes(product.id);
        if (product.isDesignersDiscount !== shouldFlag) {
          try {
            await fetch(`https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/products/${product.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                ...product,
                isDesignersDiscount: shouldFlag
              })
            });
          } catch (err) {
            console.error('Failed to update product:', product.id);
          }
        }
      });
      
      await Promise.all(updatePromises);
      
      alert(`✅ Successfully saved ${selectedProductIds.length} products to Designers On Discount!`);
      console.log('✅ Designers Discount updated:', selectedProductIds);
    } catch (error: any) {
      console.error('Failed to save designers discount:', error);
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Filter products by selected brands and search
  const filteredProducts = products.filter(p => 
    selectedBrands.includes(p.brand) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBrands = allBrands.filter(brand => 
    brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-6 py-3 rounded-full ${step === 'brands' ? 'bg-gold text-white' : 'bg-gray-200'}`}>
              <span className="font-bold">1</span>
              <span>Select Brands</span>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400" />
            <div className={`flex items-center gap-2 px-6 py-3 rounded-full ${step === 'products' ? 'bg-gold text-white' : 'bg-gray-200'}`}>
              <span className="font-bold">2</span>
              <span>Select Products</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {step === 'brands' ? 'Step 1: Select Brands' : 'Step 2: Select Products'}
            </h1>
            <p className="text-gray-600">
              {step === 'brands' 
                ? 'Choose which brands are on discount' 
                : `Choose up to 8 products from ${selectedBrands.length} selected brand(s)`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {step === 'products' && (
              <Button variant="outline" onClick={() => setStep('brands')}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Brands
              </Button>
            )}
            
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {step === 'brands' ? 'Brands Selected' : 'Products Selected'}
              </p>
              <p className={`text-2xl font-bold ${
                step === 'brands' 
                  ? 'text-gold' 
                  : selectedProductIds.length >= 8 ? 'text-red-600' : 'text-gold'
              }`}>
                {step === 'brands' ? selectedBrands.length : `${selectedProductIds.length} / 8`}
              </p>
            </div>
            
            <Button 
              onClick={step === 'brands' ? () => setStep('products') : handleSave} 
              disabled={saving || (step === 'brands' && selectedBrands.length === 0)} 
              className="bg-gold hover:bg-gold/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : step === 'brands' ? 'Next: Select Products' : 'Save Collection'}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={step === 'brands' ? "Search brands..." : "Search products..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : step === 'brands' ? (
          /* Brands Grid */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBrands.map((brand) => (
              <div
                key={brand}
                className={`bg-white rounded-xl p-6 text-center border-2 transition-all cursor-pointer ${
                  selectedBrands.includes(brand)
                    ? 'border-gold bg-gold/5'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
                onClick={() => toggleBrand(brand)}
              >
                {selectedBrands.includes(brand) && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-gold" />
                  </div>
                )}
                <h3 className="font-semibold text-lg uppercase mb-3">{brand}</h3>
                <span className={`inline-block px-4 py-2 rounded-full text-xs font-semibold uppercase ${
                  selectedBrands.includes(brand)
                    ? 'bg-gold text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {selectedBrands.includes(brand) ? 'SELECTED' : 'SELECT'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product: any) => (
              <div
                key={product.id}
                className={`bg-white rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedProductIds.includes(product.id)
                    ? 'border-gold bg-gold/5'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
                onClick={() => toggleProduct(product.id)}
              >
                <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                  <img 
                    src={product.image || '/placeholder.png'} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">{product.brand}</p>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gold">${product.price}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedProductIds.includes(product.id)
                        ? 'bg-gold text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {selectedProductIds.includes(product.id) ? '✓' : '+'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {((step === 'brands' && filteredBrands.length === 0) || 
          (step === 'products' && filteredProducts.length === 0)) && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {step === 'brands' 
                ? 'No brands found matching your search.' 
                : selectedBrands.length === 0
                  ? 'Please select at least one brand first.'
                  : 'No products found matching your search.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
