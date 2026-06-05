import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Save, Grid, List, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'https://u3c5ywl3vp3gz3tkcczpr5pztm0ozkbc.lambda-url.us-east-1.on.aws';
const MAX_LEADING = 8;

export default function LeadingBrandsCMS() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getAllProducts();
      const productsArray = (data.items || []).filter((p: any) => p && p.id && p.name && p.name !== 'undefined' && p.price != null);
      setAllProducts(productsArray);
      const brandList = (Array.from(new Set(productsArray.map((p: any) => p.brand).filter(Boolean))) as string[]).filter((b: string) => b.length > 0);
      setBrands(brandList);
      const featured = productsArray.filter((p: any) => p.isLeadingBrand).slice(0, MAX_LEADING);
      setSelectedIds(featured.map((p: any) => p.id));
      if (brandList.length > 0 && !selectedBrand) {
        setSelectedBrand(featured.length > 0 ? featured[0].brand : brandList[0]);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(productId)) return prev.filter(id => id !== productId);
      if (prev.length >= MAX_LEADING) { alert(`Max ${MAX_LEADING} products`); return prev; }
      return [...prev, productId];
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
      
      const uniqueIds = [...new Set(selectedIds)].slice(0, MAX_LEADING);
      
      console.log(`LeadingBrands save start: selected=${uniqueIds.length}`);
      console.log('Using endpoint:', ADMIN_API_URL);
      console.log('Token present:', !!token);
      
      const previouslyFlagged = allProducts.filter((p: any) => p.isLeadingBrand && !uniqueIds.includes(p.id));
      const newlyFlagged = allProducts.filter((p: any) => !p.isLeadingBrand && uniqueIds.includes(p.id));
      
      const toUpdate = [...previouslyFlagged, ...newlyFlagged];
      console.log(`LeadingBrands: Unflagging ${previouslyFlagged.length}, Flagging ${newlyFlagged.length}`);
      console.log('Products to update:', toUpdate.map(p => p.id));
      
      if (toUpdate.length === 0) {
        alert('No changes to save');
        setSaving(false);
        return;
      }
      
      const batchSize = 5;
      const succeeded: string[] = [];
      const failed: any[] = [];
      
      for (let i = 0; i < toUpdate.length; i += batchSize) {
        const batch = toUpdate.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toUpdate.length / batchSize)}:`, batch.map(p => ({ id: p.id, name: p.name, flag: !uniqueIds.includes(p.id) })));
        
        const batchPromises = batch.map(async (product) => {
          const shouldFlag = uniqueIds.includes(product.id);
          const payload = { ...product, isLeadingBrand: shouldFlag };
          
          try {
            const response = await fetch(`${ADMIN_API_URL}/products/${product.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.replace(/^["']|["']$/g, '')}`
              },
              body: JSON.stringify(payload)
            });
            
            const responseText = await response.text().catch(() => '');
            
            if (!response.ok) {
              console.error(`Failed product ${product.id}:`, response.status, responseText);
              failed.push({ productId: product.id, status: response.status, body: responseText });
            } else {
              console.log(`Updated product ${product.id}:`, product.name, '→', shouldFlag);
              succeeded.push(product.id);
            }
          } catch (err: any) {
            console.error(`Network error product ${product.id}:`, err.message);
            failed.push({ productId: product.id, reason: err.message });
          }
        });
        
        await Promise.allSettled(batchPromises);
        
        if (i + batchSize < toUpdate.length) {
          await new Promise(r => setTimeout(r, 300));
        }
      }
      
      console.log(`Save complete: ${succeeded.length} succeeded, ${failed.length} failed`);
      if (failed.length > 0) console.table(failed);
      
      if (failed.length > 0) {
        alert(`⚠️ ${failed.length} products failed to save. Check console for details.`);
      } else {
        alert(`✅ Successfully saved ${uniqueIds.length} products!`);
        loadProducts();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(product => {
    if (!product || !product.name) return false;
    if (selectedBrand && product.brand !== selectedBrand) return false;
    const term = searchTerm.toLowerCase();
    return product.name.toLowerCase().includes(term) || (product.brand || '').toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin Dashboard
        </Button>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Leading Brands</h1>
            <p className="text-gray-600">{selectedBrand ? `Select up to ${MAX_LEADING} products from ${selectedBrand}` : `Select a brand first, then choose up to ${MAX_LEADING} products`}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right"><p className="text-sm text-gray-600">Selected</p><p className={`text-2xl font-bold ${selectedIds.length >= MAX_LEADING ? 'text-red-600' : 'text-gold'}`}>{selectedIds.length} / {MAX_LEADING}</p></div>
            <Button onClick={handleSave} disabled={saving || selectedIds.length === 0 || !selectedBrand} className="bg-gold hover:bg-gold/90"><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Collection'}</Button>
          </div>
        </div>

        {!selectedBrand ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Step 1: Select a Brand</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands.map((brand) => (
                <button key={brand} onClick={() => setSelectedBrand(brand)} className="p-4 bg-beige-50 rounded-lg hover:bg-gold hover:text-white transition-all duration-300 shadow-sm hover:shadow-md">
                  <Package className="w-8 h-8 mx-auto mb-2" />
                  <span className="font-medium text-sm">{brand}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={() => setSelectedBrand('')} className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to Brands</Button>
                  <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder={`Search products in ${selectedBrand}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
                </div>
                <div className="flex gap-2 border-l pl-4">
                  <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}><Grid className="w-4 h-4" /></Button>
                  <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className={`bg-white rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-300 ${selectedIds.includes(product.id) ? 'border-gold bg-gold/5 shadow-lg' : 'border-gray-200 hover:border-gold/50 hover:shadow-md'}`} onClick={() => toggleProduct(product.id)}>
                    <div className="relative aspect-[3/4] bg-beige-50">
                      <img src={product.image || '/placeholder.png'} alt={product.name} className="w-full h-full object-cover" />
                      {selectedIds.includes(product.id) && <div className="absolute top-2 left-2 px-3 py-1 bg-gold text-white text-xs font-medium rounded-full">Selected</div>}
                      <button onClick={(e) => { e.stopPropagation(); toggleProduct(product.id); }} disabled={selectedIds.length >= MAX_LEADING && !selectedIds.includes(product.id)} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${selectedIds.includes(product.id) ? 'bg-gold text-white' : selectedIds.length >= MAX_LEADING ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gold hover:text-white'}`}>{selectedIds.includes(product.id) ? <Search className="w-4 h-4" /> : <span className="text-lg font-bold">+</span>}</button>
                    </div>
                    <div className="p-4"><p className="text-xs uppercase text-gray-500 mb-1">{product.brand}</p><h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3><p className="text-gold font-bold">${product.price}</p></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow divide-y">
                {filteredProducts.map(product => (
                  <div key={product.id} className={`p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${selectedIds.includes(product.id) ? 'bg-gold/5' : 'hover:bg-gray-50'}`} onClick={() => toggleProduct(product.id)}>
                    <div className="w-20 h-24 bg-beige-50 rounded overflow-hidden flex-shrink-0"><img src={product.image || '/placeholder.png'} alt={product.name} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs uppercase text-gray-500">{product.brand}</p><h3 className="font-semibold line-clamp-1">{product.name}</h3></div>
                    <span className="text-gold font-bold text-lg">${product.price}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleProduct(product.id); }} disabled={selectedIds.length >= MAX_LEADING && !selectedIds.includes(product.id)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${selectedIds.includes(product.id) ? 'bg-gold text-white' : selectedIds.length >= MAX_LEADING ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gold hover:text-white'}`}>{selectedIds.includes(product.id) ? <Search className="w-5 h-5" /> : <span className="text-xl font-bold">+</span>}</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}