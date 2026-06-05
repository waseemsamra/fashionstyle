import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Save, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'https://u3c5ywl3vp3gz3tkcczpr5pztm0ozkbc.lambda-url.us-east-1.on.aws';
const MAX_READY = 8;

export default function ReadyToShipCMS() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getAllProducts();
      const productsArray = (data.items || []).filter((p: any) => p && p.id);
      setAllProducts(productsArray);
      const collectionProducts = productsArray.filter((p: any) => p.isReadyToShip);
      setSelectedIds(collectionProducts.map((p: any) => p.id));
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(productId)) return prev.filter(id => id !== productId);
      if (prev.length >= MAX_READY) { alert(`You can only select up to ${MAX_READY} products`); return prev; }
      return [...prev, productId];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('jwt_token');
      if (!token) { alert('Please login as admin first'); navigate('/admin/login'); return; }
      const updatePromises = allProducts.map(async (product) => {
        const shouldFlag = selectedIds.includes(product.id);
        if (product.isReadyToShip !== shouldFlag) {
          return fetch(`${ADMIN_API_URL}/products/${product.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token.replace(/^["']|["']$/g, '')}` },
            body: JSON.stringify({ ...product, isReadyToShip: shouldFlag })
          });
        }
      }).filter(Boolean);
      if (updatePromises.length > 0) await Promise.all(updatePromises);
      alert(`✅ Successfully saved ${selectedIds.length} products!`);
    } catch (error: any) {
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally { setSaving(false); }
  };

  const filteredProducts = allProducts.filter(product => {
    if (!product || !product.name) return false;
    const s = searchTerm.toLowerCase();
    return product.name.toLowerCase().includes(s) || 
      (product.brand && product.brand.toLowerCase().includes(s)) ||
      (product.category && product.category.toLowerCase().includes(s)) ||
      (product.sku && product.sku.toLowerCase().includes(s));
  });

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin Dashboard
        </Button>
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold mb-2">Ready To Ship</h1><p className="text-gray-600">Select up to {MAX_READY} products ({allProducts.length} total)</p></div>
          <div className="text-right"><p className="text-sm text-gray-600">Selected</p><p className={`text-2xl font-bold ${selectedIds.length >= MAX_READY ? 'text-red-600' : 'text-gold'}`}>{selectedIds.length} / {MAX_READY}</p></div>
          <Button onClick={handleSave} disabled={saving || selectedIds.length === 0} className="bg-gold hover:bg-gold/90"><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}</Button>
        </div>
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
            <div className="flex gap-2"><Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}><Grid className="w-4 h-4" /></Button><Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="w-4 h-4" /></Button></div>
          </div>
        </div>
        {loading ? <p>Loading...</p> : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className={`bg-white rounded-xl overflow-hidden border-2 cursor-pointer ${selectedIds.includes(product.id) ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gold/50'}`} onClick={() => toggleProduct(product.id)}>
                <img src={product.image || '/placeholder.png'} alt={product.name} className="aspect-[3/4] object-cover w-full" />
                <div className="p-4"><p className="text-xs uppercase">{product.brand}</p><h3 className="font-semibold">{product.name}</h3><span className="font-bold text-gold">${product.price}</span></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y">
            {filteredProducts.map(product => (
              <div key={product.id} className="p-4 flex items-center gap-4"><div className="w-16 h-20 bg-gray-100 rounded overflow-hidden"><img src={product.image || '/placeholder.png'} alt={product.name} className="w-full h-full object-cover" /></div>
                <div className="flex-1"><p className="text-xs uppercase">{product.brand}</p><h3 className="font-semibold">{product.name}</h3></div><span className="font-bold text-gold">${product.price}</span>
                <button onClick={() => toggleProduct(product.id)} className={`px-3 py-1 rounded-full text-xs ${selectedIds.includes(product.id) ? 'bg-gold text-white' : 'bg-gray-200'}`}>{selectedIds.includes(product.id) ? '✓' : '+'}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}