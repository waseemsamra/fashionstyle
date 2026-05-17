import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, CheckSquare, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ProductForm from '@/components/admin/ProductForm';
import { getAllProducts, deleteProduct, createProduct, updateProduct } from '@/services/productService';
import { brandService } from '@/services/brandService';
import { categoryService } from '@/services/categoryService';
import { getProductImage, handleImageError } from '@/utils/productImage';
import { Checkbox } from '@/components/ui/checkbox';

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
  materials?: string[];
  patterns?: string[];
  occasions?: string[];
  genders?: string[];
  active?: boolean;
}

// Default metadata options
const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Bridal Wear' },
  { id: '2', name: 'Casual Wear' },
  { id: '3', name: 'Formal Wear' },
  { id: '4', name: 'Accessories' },
  { id: '5', name: 'Festive Collection' },
  { id: '6', name: 'New Arrivals' },
];

const DEFAULT_SIZES = [
  { id: '1', code: 'XS', name: 'Extra Small' },
  { id: '2', code: 'S', name: 'Small' },
  { id: '3', code: 'M', name: 'Medium' },
  { id: '4', code: 'L', name: 'Large' },
  { id: '5', code: 'XL', name: 'Extra Large' },
  { id: '6', code: 'XXL', name: 'Double XL' },
];

const DEFAULT_COLORS = [
  { id: '1', name: 'Black', code: '#000000' },
  { id: '2', name: 'White', code: '#FFFFFF' },
  { id: '3', name: 'Red', code: '#FF0000' },
  { id: '4', name: 'Blue', code: '#0000FF' },
  { id: '5', name: 'Green', code: '#008000' },
  { id: '6', name: 'Yellow', code: '#FFFF00' },
  { id: '7', name: 'Orange', code: '#FFA500' },
  { id: '8', name: 'Purple', code: '#800080' },
  { id: '9', name: 'Pink', code: '#FFC0CB' },
  { id: '10', name: 'Brown', code: '#A52A2A' },
  { id: '11', name: 'Gray', code: '#808080' },
  { id: '12', name: 'Navy', code: '#000080' },
  { id: '13', name: 'Gold', code: '#FFD700' },
  { id: '14', name: 'Silver', code: '#C0C0C0' },
  { id: '15', name: 'Beige', code: '#F5F5DC' },
  { id: '16', name: 'Cream', code: '#FFFDD0' },
  { id: '17', name: 'Maroon', code: '#800000' },
  { id: '18', name: 'Teal', code: '#008080' },
];

const DEFAULT_MATERIALS = [
  { id: '1', name: 'Cotton' },
  { id: '2', name: 'Silk' },
  { id: '3', name: 'Chiffon' },
  { id: '4', name: 'Organza' },
  { id: '5', name: 'Velvet' },
  { id: '6', name: 'Linen' },
  { id: '7', name: 'Satin' },
  { id: '8', name: 'Georgette' },
];

const DEFAULT_PATTERNS = [
  { id: '1', name: 'Solid' },
  { id: '2', name: 'Printed' },
  { id: '3', name: 'Embroidered' },
  { id: '4', name: 'Striped' },
  { id: '5', name: 'Floral' },
  { id: '6', name: 'Geometric' },
];

const DEFAULT_OCCASIONS = [
  { id: '1', name: 'Casual' },
  { id: '2', name: 'Formal' },
  { id: '3', name: 'Wedding' },
  { id: '4', name: 'Party' },
  { id: '5', name: 'Office' },
  { id: '6', name: 'Festive' },
];

const DEFAULT_GENDERS = [
  { id: '1', name: 'Women' },
  { id: '2', name: 'Men' },
  { id: '3', name: 'Unisex' },
  { id: '4', name: 'Girls' },
  { id: '5', name: 'Boys' },
];

export default function AdminProducts() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');

  // Extract unique categories and brands from products
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  const uniqueBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [sizes] = useState(DEFAULT_SIZES);
  const [colors] = useState(DEFAULT_COLORS);
  const [materials] = useState(DEFAULT_MATERIALS);
  const [patterns] = useState(DEFAULT_PATTERNS);
  const [occasions] = useState(DEFAULT_OCCASIONS);
  const [genders] = useState(DEFAULT_GENDERS);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  useEffect(() => {
    // Load products, brands, and categories on mount
    loadProducts();
    loadBrands();
    loadCategories();
  }, []);

  const loadBrands = async () => {
    try {
      console.log('🏷️ Fetching brands for product form...');
      const result: any = await brandService.getAllBrands();
      
      // Handle both possible response structures
      let brandsArray = [];
      if (Array.isArray(result)) {
        brandsArray = result;
      } else if (result && result.items && Array.isArray(result.items)) {
        brandsArray = result.items;
      } else if (result && result.brands && Array.isArray(result.brands)) {
        brandsArray = result.brands;
      } else if (result && result.data && Array.isArray(result.data)) {
        brandsArray = result.data;
      }
      
      console.log('✅ Loaded', brandsArray.length, 'brands');
      setBrands(brandsArray);
    } catch (error) {
      console.error('❌ Failed to fetch brands:', error);
      // Brands will remain empty, but form can still create new ones
    }
  };

  const loadCategories = async () => {
    try {
      console.log('📂 Fetching categories from API...');
      const fetchedCategories = await categoryService.getAllCategories();
      
      if (fetchedCategories && fetchedCategories.length > 0) {
        // Convert to the format expected by ProductForm
        const categoriesWithIds = fetchedCategories.map((cat: any) => ({
          id: cat.id || cat.name,
          name: cat.name,
          image: cat.image,
          count: cat.count,
        }));
        
        console.log('✅ Loaded', categoriesWithIds.length, 'categories from API');
        setCategories(categoriesWithIds);
      } else {
        console.log('🟡 No categories returned from API, using defaults');
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      console.log('🟡 Using default categories as fallback');
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      console.log('📦 Loading products from backend API...');

      // Check authentication first
      const token = localStorage.getItem('jwt_token') || localStorage.getItem('idToken');
      console.log('🔑 Auth token present:', !!token);

      if (!token) {
        console.warn('⚠️ No authentication token found');
        toast.error('Please log in to view products');
        setLoading(false);
        return;
      }

      const products = await getAllProducts();

      console.log('✅ Loaded', products.length, 'products from API');
      console.log('📦 Products data:', products);

      setProducts(products);

      if (products.length > 0) {
        toast.success(`Loaded ${products.length} products`);
      } else {
        toast.info('No products found. Add your first product!');
      }
    } catch (error: any) {
      console.error('❌ Failed to load products:', error);
      console.error('❌ Error details:', error.response?.data);

      // Handle authentication errors
      if (error.message.includes('Session expired') || error.message.includes('log in')) {
        toast.error('Session expired. Please log in again.');
      } else if (error.message.includes('404')) {
        toast.error('Products API endpoint not found. Check API Gateway configuration.');
      } else {
        toast.error('Failed to load products. Please try again.');
      }

      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Refreshing product list...');
    toast.info('Refreshing products...');
    setSelectedProducts(new Set()); // Clear selection
    await loadProducts();
  };

  // Bulk selection functions
  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllProducts = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    let successCount = 0;
    let failedCount = 0;
    const failedProducts: string[] = [];
    const errorMessages: string[] = [];

    console.log(`🗑️ Starting bulk deletion of ${selectedProducts.size} products...`);
    toast.info(`Starting deletion of ${selectedProducts.size} products...`);

    const selectedArray = Array.from(selectedProducts);
    for (let i = 0; i < selectedArray.length; i++) {
      const productId = selectedArray[i];
      console.log(`🗑️ [${i + 1}/${selectedArray.length}] Deleting product: ${productId}`);
      
      try {
        const success = await deleteProduct(productId);
        if (success) {
          successCount++;
          console.log(`✅ [${i + 1}/${selectedArray.length}] Deleted successfully`);
        } else {
          failedCount++;
          failedProducts.push(productId);
          const errorMsg = `Product ${i + 1} failed: ${productId}`;
          errorMessages.push(errorMsg);
          console.error(`❌ [${i + 1}/${selectedArray.length}] ${errorMsg}`);
        }
      } catch (error: any) {
        console.error(`❌ [${i + 1}/${selectedArray.length}] Error deleting ${productId}:`, error);
        console.error(`Error details:`, error.message);
        console.error(`Full error:`, JSON.stringify(error, null, 2));
        
        failedCount++;
        failedProducts.push(productId);
        errorMessages.push(`${productId}: ${error.message}`);
      }

      // Update progress every 5 products
      if ((i + 1) % 5 === 0) {
        toast.info(`Deleting... ${i + 1}/${selectedArray.length} (${successCount} success, ${failedCount} failed)`);
      }
    }

    console.log(`✅ Bulk deletion complete:`);
    console.log(`   - Success: ${successCount}`);
    console.log(`   - Failed: ${failedCount}`);
    if (errorMessages.length > 0) {
      console.error(`Failed products:`, errorMessages);
    }

    if (failedCount === 0) {
      toast.success(`✅ Successfully deleted ${successCount} product(s)!`);
      
      // Auto-refresh the product list after successful deletion
      await loadProducts();
      setSelectedProducts(new Set());
      setDeleting(false);
    } else if (successCount > 0) {
      // Some succeeded, some failed
      toast.warning(`⚠️ Deleted ${successCount} product(s), ${failedCount} failed. Refresh to see updated list.`, {
        duration: 5000,
      });
      
      console.warn('⚠️ Some deletations failed:');
      console.warn('Failed product IDs:', failedProducts);
      console.warn('Error messages:', errorMessages);
      
      // Still refresh to show what was deleted
      await loadProducts();
      setSelectedProducts(new Set());
      setDeleting(false);
    } else {
      // All failed
      toast.error(`❌ Delete failed for all ${failedCount} product(s). Check console for details.`);
      
      console.error('═══════════════════════════════════════');
      console.error('DELETE OPERATION FAILED');
      console.error('═══════════════════════════════════════');
      console.error(`Failed: ${failedCount}`);
      console.error('Failed product IDs:', failedProducts);
      console.error('Error messages:', errorMessages);
      console.error('═══════════════════════════════════════');
      
      setDeleting(false);
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
    const product: any = {
      id: editingProduct?.id || undefined,
      name: data.name,
      description: data.description,
      price: parseFloat(data.price) || 0,
      originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
      category: data.category,
      brand: data.brand,
      image: data.image,
      images: data.images || [],
      stock: parseInt(data.stock) || 0,
      sku: data.sku,
      sizes: data.sizes || [],
      colors: data.colors || [],
      materials: data.materials || [],
      patterns: data.patterns || [],
      occasions: data.occasions || [],
      genders: data.genders || [],
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured || false,
      isNew: data.isNew || false,
      isSale: data.isSale || false,
      tags: data.tags || [],
    };

    try {
      if (editingProduct) {
        // Update existing
        const updatedProduct = await updateProduct(product);
        console.log('✅ Product updated successfully:', updatedProduct);

        // Force cache invalidation and immediate refresh
        console.log('🔄 Force refreshing product list after save...');
        
        // Small delay to ensure backend has processed the save
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Clear any query cache and fetch fresh data
        const allProducts = await getAllProducts();
        console.log('📦 Fresh products loaded:', allProducts.length);
        
        // Update the specific product in the local state if it exists
        setProducts(prevProducts => {
          const updatedProducts = prevProducts.map(p => 
            p.id === product.id ? { ...p, ...product } : p
          );
          console.log('🔄 Updated product in state:', product.id, product.isFeatured);
          return updatedProducts;
        });
      } else {
        // Add new
        const created = await createProduct(product);
        const updated = [...products, created];
        setProducts(updated as Product[]);
      }
      setShowFormModal(false);
    } catch (error: any) {
      console.error('❌ Failed to save product:', error);
      // Don't show toast here - let the form handle it
      throw error;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const success = await deleteProduct(id);
        if (success) {
          const updated = products.filter(p => p.id !== id);
          setProducts(updated);
          toast.success('Product deleted successfully!');
        } else {
          toast.error('Failed to delete product');
        }
      } catch (error: any) {
        console.error('Failed to delete product:', error);
        toast.error(error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

   const filteredProducts = products.filter(product => {
     const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase());
     const matchesCategory = filterCategory === 'all' || 
       (product.category && product.category.toLowerCase() === filterCategory.toLowerCase());
     const matchesBrand = filterBrand === 'all' || 
       (product.brand && product.brand.toLowerCase() === filterBrand.toLowerCase());
 
     return matchesSearch && matchesCategory && matchesBrand;
   });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  // Reset to page 1 when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedProducts(new Set()); // Clear selection on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Debug logging for empty results
  useEffect(() => {
    if (products.length > 0 && filteredProducts.length === 0) {
      console.log('🔍 Filter debug:', {
        searchTerm,
        filterCategory,
        totalProducts: products.length,
        filteredCount: filteredProducts.length
      });
    }
  }, [searchTerm, filterCategory, products.length]);

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
          <p className="text-gray-600 mt-1">
            Manage your product catalog • {products.length} product{products.length !== 1 ? 's' : ''} loaded
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            className="gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddProduct} className="bg-gold hover:bg-gold/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Bulk Selection Info Bar */}
      {selectedProducts.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">
              {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : `Delete ${selectedProducts.size} Product${selectedProducts.size > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}

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
                <option value="all">All Categories ({products.length})</option>
                {uniqueCategories.sort().map(cat => (
                  <option key={cat} value={cat}>{cat} ({products.filter(p => p.category === cat).length})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Filter by Brand</Label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="all">All Brands ({products.length})</option>
                {uniqueBrands.sort().map(brand => (
                  <option key={brand} value={brand}>{brand} ({products.filter(p => p.brand === brand).length})</option>
                ))}
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
                    <th className="px-6 py-4 text-left text-sm font-semibold w-12">
                      <Checkbox
                        checked={paginatedProducts.length > 0 && selectedProducts.size === paginatedProducts.length}
                        onCheckedChange={selectAllProducts}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className={`border-b hover:bg-gray-50 ${selectedProducts.has(product.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => toggleSelectProduct(product.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => handleImageError(e, product.name)}
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

          {/* Pagination Controls */}
          {filteredProducts.length > 0 && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Info */}
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span> of{' '}
                  <span className="font-medium">{filteredProducts.length}</span> products
                </div>

                {/* Page Size Info */}
                <div className="text-sm text-gray-500">
                  {itemsPerPage} per page
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    ‹ Prev
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 py-1 text-gray-400"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page as number)}
                          className={`min-w-[40px] ${
                            currentPage === page
                              ? 'bg-gold hover:bg-gold/90 text-white'
                              : ''
                          }`}
                        >
                          {page}
                        </Button>
                      )
                    ))}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Next ›
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Modal */}
      {showFormModal && (
        <ProductForm
          key={editingProduct?.id || 'new'}
          open={showFormModal}
          onOpenChange={setShowFormModal}
          onSubmit={handleSaveProduct}
          initialData={editingProduct}
          brands={brands}
          categories={categories}
          sizes={sizes}
          colors={colors}
          materials={materials}
          patterns={patterns}
          occasions={occasions}
          genders={genders}
        />
      )}
    </div>
  );
}
