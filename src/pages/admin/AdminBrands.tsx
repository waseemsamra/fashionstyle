import { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// API Gateway URL
import { API_CONFIG } from '../../config/api';
const BRANDS_API_URL = API_CONFIG.brandsApi;

interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  active?: boolean;
  products?: number;
}

export default function AdminBrands() {
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDescription, setNewBrandDescription] = useState('');

  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('admin_access') === 'true' && 
                           localStorage.getItem('jwt_token') && 
                           localStorage.getItem('jwt_token')!.length > 10;

  useEffect(() => {
    if (!isAuthenticated) {
      console.error('❌ User not authenticated for admin brands');
      toast.error('Please log in to access admin features');
      return;
    }
    loadBrands();
  }, [isAuthenticated]);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setLoading(true);
    try {
      console.log('📦 Loading brands from new Brands API...');
      console.log('🌐 Using BRANDS_API_URL:', BRANDS_API_URL);
      const token = localStorage.getItem('jwt_token');

      const response = await fetch(BRANDS_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Brands response:', data);
      
      // Handle direct array response from API
      const brandsData = Array.isArray(data) ? data : [];

      if (brandsData.length > 0) {
        // Ensure each brand has required fields
        const processedBrands = brandsData.map((brand: any) => ({
          id: brand.id || brand.name?.toLowerCase().replace(/\s+/g, '-'),
          name: brand.name || 'Unknown Brand',
          description: brand.description || '',
          logo: brand.logo || '',
          active: brand.active !== false,
          products: brand.products || 0
        }));
        setBrands(processedBrands);
        console.log('✅ Loaded', processedBrands.length, 'brands from API');
      } else {
        console.log('⚠️ No brands found in API');
        setBrands([]);
        toast.info('No brands found - add your first brand!');
      }
    } catch (error: any) {
      console.error('❌ Failed to load brands from API:', error);
      toast.error('Failed to load brands: ' + (error.message || 'Unknown error'));
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = () => {
    setEditingBrand(null);
    setNewBrandName('');
    setNewBrandDescription('');
    setShowAddModal(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setNewBrandName(brand.name);
    setNewBrandDescription(brand.description || '');
    setShowAddModal(true);
  };

  const handleSaveBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error('Brand name is required');
      return;
    }

    try {
      const token = localStorage.getItem('jwt_token');
      console.log('🔑 JWT Token available:', !!token);
      console.log('🔑 JWT Token length:', token?.length || 0);
      console.log('🌐 Using Function URL - no authentication required');

      if (editingBrand) {
        // Update existing brand via PUT
        console.log('📝 Updating brand:', editingBrand.id);
        console.log('📝 Request URL:', `${BRANDS_API_URL}/${editingBrand.id}`);
        console.log('📝 Request body:', { name: newBrandName, description: newBrandDescription });
        
        // Function URL doesn't require authentication
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        console.log('📝 Request headers (Function URL - no auth):', headers);
        
        const response = await fetch(`${BRANDS_API_URL}/${editingBrand.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            name: newBrandName,
            description: newBrandDescription
          })
        });

        console.log('📝 Response status:', response.status);
        const responseData = await response.json();
        console.log('📝 Response data:', responseData);

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Authentication required. Please log in again to update brands.');
          }
          throw new Error(responseData.message || `HTTP ${response.status}`);
        }

        toast.success('Brand updated successfully!');
      } else {
        // Add new brand via API
        console.log('📝 Creating brand via API...');
        const brandData = {
          name: newBrandName,
          description: newBrandDescription
        };
        console.log('📝 Request URL:', BRANDS_API_URL);
        console.log('📝 Request body:', brandData);
        
        // Function URL doesn't require authentication
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        console.log('📝 Request headers (Function URL - no auth):', headers);
        
        const response = await fetch(BRANDS_API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(brandData)
        });

        console.log('📝 Response status:', response.status);
        const responseData = await response.json();
        console.log('📝 Response data:', responseData);

        if (!response.ok) {
          if (responseData.error === 'Method POST not supported') {
            throw new Error('Brand creation is not currently available. Please contact administrator to enable brand creation functionality.');
          }
          throw new Error(responseData.message || `HTTP ${response.status}`);
        }

        toast.success('Brand added successfully!');
      }

      // Reload brands from API
      await loadBrands();
      setShowAddModal(false);
    } catch (error: any) {
      console.error('❌ Failed to save brand:', error);
      toast.error('Failed to save brand: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      try {
        console.log('🗑️ Deleting brand via Function URL...');
        
        // Function URL doesn't require authentication
        const response = await fetch(`${BRANDS_API_URL}/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Authentication required. Please log in again to delete brands.');
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        toast.success('Brand deleted successfully!');
        // Reload brands from API
        await loadBrands();
      } catch (error: any) {
        console.error('Failed to delete brand:', error);
        toast.error('Failed to delete brand: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Brands Management</h1>
          <p className="text-gray-600 mt-1">Manage product brands</p>
        </div>
        <Button onClick={handleAddBrand} className="bg-gold hover:bg-gold/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Search Brands</Label>
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Brands Table */}
      <Card>
        <CardContent className="p-0">
          {filteredBrands.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold mb-2">No Brands Found</h3>
              <p className="text-gray-600 mb-4">
                {brands.length === 0 
                  ? "Get started by adding your first brand" 
                  : "Try adjusting your search"}
              </p>
              {brands.length === 0 && (
                <Button onClick={handleAddBrand} className="bg-gold hover:bg-gold/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Brand
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Brand Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Products</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.map((brand) => (
                    <tr key={brand.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {brand.logo && (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{brand.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{brand.description || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{brand.products || 0} products</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={brand.active ? 'default' : 'secondary'}>
                          {brand.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBrand(brand)}
                            title="Edit Brand"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBrand(brand.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Brand"
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingBrand ? 'Edit Brand' : 'Add New Brand'}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Brand Name *</Label>
                <Input
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g., Nike, Adidas, Zara..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newBrandDescription}
                  onChange={(e) => setNewBrandDescription(e.target.value)}
                  placeholder="Brand description..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveBrand}
                  className="bg-gold hover:bg-gold/90 flex-1"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
