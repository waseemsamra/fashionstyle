import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ProductForm from '@/components/admin/ProductForm';
import { getAllProducts, deleteProduct, createProduct, updateProduct } from '@/services/productService';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  image?: string;
  images?: string[];
  stock?: number;
  description?: string;
  sizes?: string[];
  colors?: string[];
  active?: boolean;
}

export default function AdminProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      console.log('📦 Loading products from backend API...');
      const products = await getAllProducts();
      console.log('✅ Loaded', products.length, 'products from API');
      
      if (products.length > 0) {
        setProducts(products as Product[]);
        // Cache in localStorage as backup
        localStorage.setItem('admin_products', JSON.stringify(products));
      } else {
        // Fallback to localStorage if API returns empty
        const savedProducts = localStorage.getItem('admin_products');
        if (savedProducts) {
          const parsed = JSON.parse(savedProducts);
          console.log('✅ Loaded', parsed.length, 'products from localStorage (fallback)');
          setProducts(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load products from API:', error);
      // Fallback to localStorage
      const savedProducts = localStorage.getItem('admin_products');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        console.log('✅ Loaded', parsed.length, 'products from localStorage (error fallback)');
        setProducts(parsed);
      }
      toast.error('Failed to load products from backend');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowFormModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowFormModal(true);
  };

  const handleSaveProduct = async (data: any) => {
    const product = {
      id: editingProduct?.id || Date.now().toString(),
      name: data.name,
      price: data.price,
      category: data.category,
      brand: data.brand,
      image: data.image,
      stock: data.stock,
      active: true,
      description: data.description,
      images: data.images || [],
      sizes: data.sizes || [],
      colors: data.colors || []
    };
    
    try {
      if (editingProduct) {
        // Update existing
        console.log('📝 Updating product via API...');
        await updateProduct(product);
        const updated = products.map(p => p.id === product.id ? { ...p, ...product } : p);
        setProducts(updated as Product[]);
        localStorage.setItem('admin_products', JSON.stringify(updated));
        toast.success('Product updated successfully!');
      } else {
        // Add new
        console.log('📝 Creating product via API...');
        const created = await createProduct(product);
        const updated = [...products, created];
        setProducts(updated as Product[]);
        localStorage.setItem('admin_products', JSON.stringify(updated));
        toast.success('Product added successfully!');
      }
      setShowFormModal(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Failed to save product to backend');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const success = await deleteProduct(id);
        if (success) {
          const updated = products.filter(p => p.id !== id);
          setProducts(updated);
          localStorage.setItem('admin_products', JSON.stringify(updated));
          toast.success('Product deleted successfully!');
        } else {
          toast.error('Failed to delete product');
        }
      } catch (error) {
        console.error('Failed to delete product:', error);
        toast.error('Failed to delete product from backend');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products Management</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={handleAddProduct} className="bg-gold hover:bg-gold/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search Products</Label>
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Filter by Category</Label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="all">All Categories</option>
                <option value="Casual">Casual</option>
                <option value="Formal">Formal</option>
                <option value="Bridal">Bridal</option>
                <option value="Casual Wear">Casual Wear</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-4">
                {products.length === 0 
                  ? "Get started by adding your first product" 
                  : "Try adjusting your search or filters"}
              </p>
              {products.length === 0 && (
                <Button onClick={handleAddProduct} className="bg-gold hover:bg-gold/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image || '/placeholder.png'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.brand || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{product.category || 'N/A'}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gold">${product.price}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={(product.stock || 0) > 0 ? 'default' : 'secondary'}>
                          {(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={product.active ? 'default' : 'secondary'}>
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Modal */}
      {showFormModal && (
        <ProductForm
          open={showFormModal}
          onOpenChange={setShowFormModal}
          onSubmit={handleSaveProduct}
          initialData={editingProduct}
          brands={[]}
          categories={[]}
          sizes={[]}
          colors={[]}
          materials={[]}
          patterns={[]}
          occasions={[]}
          genders={[]}
        />
      )}
    </div>
  );
}
