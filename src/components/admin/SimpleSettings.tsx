import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api, API_URL } from '@/services/api';

interface SettingsItem {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  [key: string]: any;
}

interface SimpleSettingsProps {
  section: string;
  title: string;
  description: string;
  icon?: any;
  showDescription?: boolean;
  showColor?: boolean;
  showActive?: boolean;
}

export default function SimpleSettings({
  section,
  title,
  description,
  icon: Icon,
  showDescription = true,
  showColor = false,
  showActive = false
}: SimpleSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<SettingsItem[]>([]);
  const [editingItem, setEditingItem] = useState<SettingsItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<SettingsItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadItems();
  }, [section]);

  const loadItems = async () => {
    console.log('🔍 loadItems called for section:', section);
    setLoading(true);

    // Try DynamoDB FIRST
    try {
      console.log('📡 Fetching from DynamoDB...');
      await api.saveSettingsSection(section, []); // This will fail but we'll catch it
    } catch (err) {
      // We expect this to fail - we just want to check if API is available
    }
    
    // Load from API endpoint directly
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_URL}/admin/settings-v2/${section}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        const apiItems = data.items || data.data || [];
        console.log('✅ Loaded', apiItems.length, 'items from DynamoDB');
        
        if (apiItems.length > 0) {
          setItems(apiItems);
          // Cache in localStorage
          localStorage.setItem(`admin_${section}`, JSON.stringify(apiItems));
          console.log('💾 Cached to localStorage');
        }
      } else {
        console.log('⚠️ API returned', response.status);
      }
    } catch (apiErr) {
      console.log('⚠️ API failed, trying localStorage');
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem(`admin_${section}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('✅ Loaded', parsed.length, 'items from localStorage');
      setItems(parsed);
    } else {
      console.log('⚠️ No data in localStorage');
      setItems([]);
    }
    
    setLoading(false);
    console.log('✅ loadItems complete for', section);
  };

  const handleSave = async () => {
    console.log('💾 handleSave called for section:', section);
    console.log('📋 Items to save:', items);
    
    setSaving(true);
    try {
      console.log('📡 Calling API.saveSettingsSection...');
      // Save to DynamoDB
      await api.saveSettingsSection(section, items);
      console.log(`✅ ${section} saved to DynamoDB`);
      
      // Also save to localStorage
      const jsonString = JSON.stringify(items);
      console.log('💾 Saving to localStorage:', `admin_${section}`, jsonString);
      localStorage.setItem(`admin_${section}`, jsonString);
      console.log(`💾 ${section} saved to localStorage`);
      
      // Verify it was saved
      const saved = localStorage.getItem(`admin_${section}`);
      console.log('🔍 Verification - localStorage now contains:', saved);
      
      toast.success(`${title} saved successfully!`);
    } catch (err: any) {
      console.error(`❌ Failed to save to DynamoDB:`, err);
      // Fallback to localStorage
      localStorage.setItem(`admin_${section}`, JSON.stringify(items));
      console.log(`💾 ${section} saved to localStorage (fallback)`);
      toast.success(`${title} saved locally`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWithItems = async (itemsToSave: SettingsItem[]) => {
    // Save itemsToSave directly without modifying state
    setSaving(true);
    try {
      console.log('📡 Calling API.saveSettingsSection...');
      // Save to DynamoDB
      await api.saveSettingsSection(section, itemsToSave);
      console.log(`✅ ${section} saved to DynamoDB`);
      
      // Also save to localStorage
      const jsonString = JSON.stringify(itemsToSave);
      console.log('💾 Saving to localStorage:', `admin_${section}`, jsonString);
      localStorage.setItem(`admin_${section}`, jsonString);
      console.log(`💾 ${section} saved to localStorage`);
      
      // Verify it was saved
      const saved = localStorage.getItem(`admin_${section}`);
      console.log('🔍 Verification - localStorage now contains:', saved);
      
      toast.success(`${title} saved successfully!`);
    } catch (err: any) {
      console.error(`❌ Failed to save to DynamoDB:`, err);
      // Fallback to localStorage
      localStorage.setItem(`admin_${section}`, JSON.stringify(itemsToSave));
      console.log(`💾 ${section} saved to localStorage (fallback)`);
      toast.success(`${title} saved locally`);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    console.log('🔘 handleAdd called for section:', section);
    console.log('📝 newItem data:', newItem);
    
    if (!newItem.name) {
      console.log('❌ Name is required');
      toast.error('Name is required');
      return;
    }

    const item: SettingsItem = {
      id: newItem.name.toLowerCase().replace(/\s+/g, '-'),
      name: newItem.name,
      description: newItem.description || '',
      color: newItem.color || '#000000',
      active: newItem.active !== false,
      createdAt: new Date().toISOString()
    };

    console.log('➕ Created item:', item);
    console.log('📋 Current items before add:', items);
    
    const updatedItems = [...items, item];
    console.log('📋 Updated items:', updatedItems);
    
    setItems(updatedItems);
    console.log('📋 Items state updated');
    
    setNewItem({});
    setShowAddForm(false);
    
    console.log('💾 Calling handleSaveWithItems...');
    // Auto-save - use handleSaveWithItems to save updatedItems directly
    await handleSaveWithItems(updatedItems);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    setItems(items.map(item => 
      item.id === editingItem.id ? editingItem : item
    ));
    setEditingItem(null);
    
    // Auto-save
    await handleSave();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;

    setItems(items.filter(item => item.id !== id));
    
    // Auto-save
    await handleSave();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {title.toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8" />}
          <div>
            <h2 className="text-3xl font-bold">{title}</h2>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gold hover:bg-gold/90"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : `Save ${title}`}
        </Button>
      </div>

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New {title.slice(0, -1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder={`Enter ${title.slice(0, -1).toLowerCase()} name`}
                />
              </div>
              
              {showDescription && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newItem.description || ''}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Description"
                  />
                </div>
              )}
              
              {showColor && (
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={newItem.color || '#000000'}
                    onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                    className="w-32"
                  />
                </div>
              )}
              
              {showActive && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newItem.active !== false}
                    onChange={(e) => setNewItem({ ...newItem, active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Active</span>
                </label>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleAdd} className="bg-gold">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowAddForm(true)} className="bg-gold">
              <Plus className="w-4 h-4 mr-2" />
              Add New {title.slice(0, -1)}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {title} ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No {title.toLowerCase()} yet</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {showColor && item.color && (
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {showDescription && item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {showActive && (
                      <Badge variant={item.active ? 'default' : 'secondary'}>
                        {item.active ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit {title.slice(0, -1)}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              
              {showDescription && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  />
                </div>
              )}
              
              {showColor && (
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={editingItem.color || '#000000'}
                    onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                    className="w-32"
                  />
                </div>
              )}
              
              {showActive && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingItem.active !== false}
                    onChange={(e) => setEditingItem({ ...editingItem, active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Active</span>
                </label>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleUpdate} className="bg-gold flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingItem(null)}>
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
