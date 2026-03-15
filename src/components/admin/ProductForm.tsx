import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Tag,
  DollarSign,
  Hash,
  Palette,
  Ruler,
  Shirt,
  Heart,
  Star,
  Image as ImageIcon,
  X,
  Info,
  Check,
} from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import SearchableSelect from '@/components/ui/SearchableSelect';

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  image: z.string().url('Please upload a main image'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  stock: z.number().int().nonnegative('Stock must be non-negative'),
  sku: z.string().min(1, 'SKU is required'),
  sizes: z.array(z.string()).min(1, 'At least one size is required'),
  colors: z.array(z.string()).min(1, 'At least one color is required'),
  materials: z.array(z.string()).optional(),
  patterns: z.array(z.string()).optional(),
  occasions: z.array(z.string()).optional(),
  genders: z.array(z.string()).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: any;
  brands: any[];
  categories: any[];
  sizes: any[];
  colors: any[];
  materials: any[];
  patterns: any[];
  occasions: any[];
  genders: any[];
}

export default function ProductForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  brands = [],
  categories = [],
  sizes = [],
  colors = [],
  materials = [],
  patterns = [],
  occasions = [],
  genders = [],
}: ProductFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      brand: '',
      image: '',
      images: [],
      stock: 0,
      sku: '',
      sizes: [],
      colors: [],
      materials: [],
      patterns: [],
      occasions: [],
      genders: [],
    },
  });

  useEffect(() => {
    if (initialData && open) {
      reset({
        name: initialData.name || '',
        description: initialData.description || '',
        price: Number(initialData.price) || 0,
        category: initialData.category || '',
        brand: initialData.brand || '',
        image: initialData.image || '',
        images: initialData.images || [],
        stock: Number(initialData.stock) || 0,
        sku: initialData.sku || '',
        sizes: initialData.sizes || [],
        colors: initialData.colors || [],
        materials: initialData.materials || [],
        patterns: initialData.patterns || [],
        occasions: initialData.occasions || [],
        genders: initialData.genders || [],
      });
    } else if (!initialData && open) {
      reset({
        name: '',
        description: '',
        price: 0,
        category: '',
        brand: '',
        image: '',
        images: [],
        stock: 0,
        sku: '',
        sizes: [],
        colors: [],
        materials: [],
        patterns: [],
        occasions: [],
        genders: [],
      });
    }
  }, [initialData, open, reset]);

  const watchedValues = watch();

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultiSelectChange = (
    field: any,
    value: string,
    isChecked: boolean
  ) => {
    const currentValues = field.value || [];
    if (isChecked) {
      field.onChange([...currentValues, value]);
    } else {
      field.onChange(currentValues.filter((v: string) => v !== value));
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'details', label: 'Details', icon: Tag },
    { id: 'attributes', label: 'Attributes', icon: Shirt },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0" style={{ maxWidth: '90vw', width: '1200px' }}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {initialData ? 'Edit Product' : 'Create New Product'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {initialData
                  ? 'Update product information and details'
                  : 'Add a new product to your store'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 pt-4 border-b bg-muted/30">
              <TabsList className="grid grid-cols-4 w-full h-auto bg-transparent p-0 gap-1">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="basic" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Essential product details that customers will see
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        Product Name
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      </Label>
                      <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                          <>
                            <Input
                              id="name"
                              placeholder="e.g., Classic Cotton T-Shirt"
                              {...field}
                              className={errors.name ? 'border-destructive' : ''}
                            />
                            {errors.name && (
                              <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                          </>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                          <>
                            <Textarea
                              id="description"
                              placeholder="Describe the product features, materials, and benefits..."
                              className="min-h-[120px] resize-y"
                              {...field}
                            />
                            {errors.description && (
                              <p className="text-sm text-destructive">{errors.description.message}</p>
                            )}
                          </>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Controller
                          name="category"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.category && (
                          <p className="text-sm text-destructive">{errors.category.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Controller
                          name="brand"
                          control={control}
                          render={({ field }) => (
                            <SearchableSelect
                              options={brands.map((b) => ({
                                id: b.name,
                                name: b.name,
                                description: b.description || '',
                              }))}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select or search brand..."
                              allowCreate={true}
                              onCreateNew={(newBrandName) => {
                                field.onChange(newBrandName);
                              }}
                            />
                          )}
                        />
                        {errors.brand && (
                          <p className="text-sm text-destructive">{errors.brand.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Price (USD)
                        </Label>
                        <Controller
                          name="price"
                          control={control}
                          render={({ field }) => (
                            <>
                              <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className={errors.price ? 'border-destructive' : ''}
                              />
                              {errors.price && (
                                <p className="text-sm text-destructive">{errors.price.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock" className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Stock Quantity
                        </Label>
                        <Controller
                          name="stock"
                          control={control}
                          render={({ field }) => (
                            <>
                              <Input
                                id="stock"
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className={errors.stock ? 'border-destructive' : ''}
                              />
                              {errors.stock && (
                                <p className="text-sm text-destructive">{errors.stock.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sku" className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        SKU (Stock Keeping Unit)
                      </Label>
                      <Controller
                        name="sku"
                        control={control}
                        render={({ field }) => (
                          <>
                            <Input
                              id="sku"
                              placeholder="e.g., TSH-001-BLK-M"
                              {...field}
                              className={errors.sku ? 'border-destructive' : ''}
                            />
                            {errors.sku && (
                              <p className="text-sm text-destructive">{errors.sku.message}</p>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="images" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Product Images
                    </CardTitle>
                    <CardDescription>
                      Upload high-quality images to showcase your product
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        Main Product Image
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      </Label>
                      <Controller
                        name="image"
                        control={control}
                        render={({ field }) => (
                          <ImageUpload
                            currentImage={field.value}
                            currentImages={[]}
                            onImageChange={field.onChange}
                            onImagesChange={() => {}}
                            multiple={false}
                            folder="products"
                            label="Main Image"
                          />
                        )}
                      />
                      {errors.image && (
                        <p className="text-sm text-destructive">{errors.image.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Additional Images
                        <Badge variant="secondary" className="text-xs">
                          Up to 5 images
                        </Badge>
                      </Label>
                      <Controller
                        name="images"
                        control={control}
                        render={({ field }) => (
                          <ImageUpload
                            currentImage=""
                            currentImages={field.value || []}
                            onImageChange={() => {}}
                            onImagesChange={field.onChange}
                            multiple={true}
                            maxImages={5}
                            folder="products"
                            label="Gallery Images"
                          />
                        )}
                      />
                      {errors.images && (
                        <p className="text-sm text-destructive">{errors.images.message}</p>
                      )}
                    </div>

                    {watchedValues.images && watchedValues.images.length > 0 && (
                      <div className="space-y-2">
                        <Label>Image Preview</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {watchedValues.images.map((img: string, index: number) => (
                            <div
                              key={index}
                              className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
                            >
                              <img
                                src={img}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newImages = watchedValues.images.filter(
                                    (_: any, i: number) => i !== index
                                  );
                                  setValue('images', newImages);
                                }}
                                className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Product Details
                    </CardTitle>
                    <CardDescription>
                      Define sizes, colors, and other product attributes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Available Sizes
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      </Label>
                      <Controller
                        name="sizes"
                        control={control}
                        render={({ field }) => (
                          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                            {sizes.map((size) => {
                              const isSelected = (field.value || []).includes(size.code);
                              return (
                                <Badge
                                  key={size.id}
                                  variant={isSelected ? 'default' : 'outline'}
                                  className="cursor-pointer transition-all hover:scale-105 px-4 py-2"
                                  onClick={() =>
                                    handleMultiSelectChange(field, size.code, !isSelected)
                                  }
                                >
                                  {isSelected && <Check className="h-3 w-3 mr-1" />}
                                  {size.code}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      />
                      {errors.sizes && (
                        <p className="text-sm text-destructive">{errors.sizes.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Available Colors
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      </Label>
                      <Controller
                        name="colors"
                        control={control}
                        render={({ field }) => (
                          <div className="flex flex-wrap gap-3 p-3 border rounded-lg bg-muted/30">
                            {colors.map((color) => {
                              const isSelected = (field.value || []).includes(color.name);
                              return (
                                <div
                                  key={color.id}
                                  className={`relative cursor-pointer transition-all hover:scale-110 ${
                                    isSelected
                                      ? 'ring-2 ring-primary ring-offset-2'
                                      : 'opacity-60 hover:opacity-100'
                                  }`}
                                  onClick={() =>
                                    handleMultiSelectChange(field, color.name, !isSelected)
                                  }
                                >
                                  <div
                                    className="w-10 h-10 rounded-full border-2 shadow-sm"
                                    style={{ backgroundColor: color.code }}
                                  />
                                  {isSelected && (
                                    <Check
                                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-white drop-shadow-lg"
                                      style={{
                                        textShadow: '0 0 3px rgba(0,0,0,0.8)',
                                      }}
                                    />
                                  )}
                                  <span className="text-xs text-center mt-1 block">
                                    {color.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      />
                      {errors.colors && (
                        <p className="text-sm text-destructive">{errors.colors.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Genders
                      </Label>
                      <Controller
                        name="genders"
                        control={control}
                        render={({ field }) => (
                          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                            {genders.map((gender) => {
                              const isSelected = (field.value || []).includes(gender.name);
                              return (
                                <Badge
                                  key={gender.id}
                                  variant={isSelected ? 'default' : 'outline'}
                                  className="cursor-pointer transition-all hover:scale-105 px-4 py-2"
                                  onClick={() =>
                                    handleMultiSelectChange(field, gender.name, !isSelected)
                                  }
                                >
                                  {isSelected && <Check className="h-3 w-3 mr-1" />}
                                  {gender.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attributes" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shirt className="h-5 w-5" />
                      Additional Attributes
                    </CardTitle>
                    <CardDescription>
                      Optional attributes to help customers find your product
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Materials</Label>
                      <Controller
                        name="materials"
                        control={control}
                        render={({ field }) => (
                          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                            {materials.map((material) => {
                              const isSelected = (field.value || []).includes(material.name);
                              return (
                                <Badge
                                  key={material.id}
                                  variant={isSelected ? 'secondary' : 'outline'}
                                  className="cursor-pointer transition-all hover:scale-105 px-4 py-2"
                                  onClick={() =>
                                    handleMultiSelectChange(field, material.name, !isSelected)
                                  }
                                >
                                  {isSelected && <Check className="h-3 w-3 mr-1" />}
                                  {material.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Patterns</Label>
                      <Controller
                        name="patterns"
                        control={control}
                        render={({ field }) => (
                          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                            {patterns.map((pattern) => {
                              const isSelected = (field.value || []).includes(pattern.name);
                              return (
                                <Badge
                                  key={pattern.id}
                                  variant={isSelected ? 'secondary' : 'outline'}
                                  className="cursor-pointer transition-all hover:scale-105 px-4 py-2"
                                  onClick={() =>
                                    handleMultiSelectChange(field, pattern.name, !isSelected)
                                  }
                                >
                                  {isSelected && <Check className="h-3 w-3 mr-1" />}
                                  {pattern.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Occasions</Label>
                      <Controller
                        name="occasions"
                        control={control}
                        render={({ field }) => (
                          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                            {occasions.map((occasion) => {
                              const isSelected = (field.value || []).includes(occasion.name);
                              return (
                                <Badge
                                  key={occasion.id}
                                  variant={isSelected ? 'secondary' : 'outline'}
                                  className="cursor-pointer transition-all hover:scale-105 px-4 py-2"
                                  onClick={() =>
                                    handleMultiSelectChange(field, occasion.name, !isSelected)
                                  }
                                >
                                  {isSelected && <Check className="h-3 w-3 mr-1" />}
                                  {occasion.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {isDirty && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">You have unsaved changes</p>
                          <p className="text-amber-700">
                            Make sure to review all changes before saving.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isSubmitting || !isDirty}
            className="min-w-[120px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {initialData ? 'Update Product' : 'Create Product'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
