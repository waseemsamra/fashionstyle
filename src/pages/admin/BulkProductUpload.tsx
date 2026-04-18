import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { uploadImageWithFallback } from '@/services/imageDownload';

import { API_CONFIG } from '../../config/api';
const API_URL = API_CONFIG.baseApiUrl;

interface ExcelProduct {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
  image1: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  sizes: string;
  colors: string;
  materials: string;
  patterns: string;
  occasions: string;
  genders: string;
  isFeatured: boolean;
  isNew: boolean;
  isSale: boolean;
  tags: string;
}

interface UploadProgress {
  total: number;
  uploaded: number;
  failed: number;
  currentName: string;
}

export default function BulkProductUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [products, setProducts] = useState<ExcelProduct[]>([]);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
    imageErrors?: string[];
    productsWithMissingImages?: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    setProducts([]);
    setResults(null);
    parseExcel(selectedFile);
  };

  const parseExcel = async (file: File) => {
    setParsing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('Excel file is empty');
        setParsing(false);
        return;
      }

      // Map excel columns to all product fields
      const mappedProducts: ExcelProduct[] = jsonData.map((row: any) => {
        // Helper to safely get and trim string values
        const getStr = (val: any): string => (val ? String(val).trim() : '');
        const getNum = (val: any): number => {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 0 : parsed;
        };
        const getBool = (val: any): boolean => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') {
            const lower = val.toLowerCase().trim();
            return lower === 'true' || lower === 'yes' || lower === '1';
          }
          return false;
        };

        return {
          name: getStr(row['Product Title'] || row['product_title'] || row['name']),
          description: getStr(row['Description'] || row['description']),
          price: getNum(row['Price'] || row['price']),
          originalPrice: row['Original Price'] || row['originalPrice'] || row['Compare Price'] ? getNum(row['Original Price'] || row['originalPrice'] || row['Compare Price']) : undefined,
          category: getStr(row['Category'] || row['category']),
          brand: getStr(row['Brand'] || row['brand']),
          sku: getStr(row['SKU'] || row['sku']),
          stock: getNum(row['Stock'] || row['stock'] || row['Inventory'] || row['inventory']),
          image1: getStr(row['Image 1'] || row['image1'] || row['Image1']),
          image2: getStr(row['Image 2'] || row['image2'] || row['Image2']) || undefined,
          image3: getStr(row['Image 3'] || row['image3'] || row['Image3']) || undefined,
          image4: getStr(row['Image 4'] || row['image4'] || row['Image4']) || undefined,
          image5: getStr(row['Image 5'] || row['image5'] || row['Image5']) || undefined,
          sizes: getStr(row['Sizes'] || row['sizes']),
          colors: getStr(row['Colors'] || row['colors']),
          materials: getStr(row['Materials'] || row['materials']),
          patterns: getStr(row['Patterns'] || row['patterns']),
          occasions: getStr(row['Occasions'] || row['occasions']),
          genders: getStr(row['Genders'] || row['genders']),
          isFeatured: getBool(row['Featured'] || row['isFeatured'] || row['featured']),
          isNew: getBool(row['New'] || row['isNew'] || row['new'] || row['Is New']),
          isSale: getBool(row['Sale'] || row['isSale'] || row['sale'] || row['On Sale']),
          tags: getStr(row['Tags'] || row['tags']),
        };
      });

      const validProducts = mappedProducts.filter(p => p.name && p.image1);

      if (validProducts.length === 0) {
        toast.error('No valid products found. Required: Product Title, Image 1');
      } else {
        setProducts(validProducts);
        toast.success(`Found ${validProducts.length} products in Excel file`);
      }
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast.error('Failed to parse Excel file');
    } finally {
      setParsing(false);
    }
  };

  const createProduct = async (product: ExcelProduct & { allImages?: string[]; image1Url?: string }): Promise<void> => {
    const images = product.allImages && product.allImages.length > 0
      ? product.allImages
      : [product.image1];

    // Parse comma-separated strings into arrays
    const parseArray = (str: string): string[] => 
      str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

    const productData = {
      name: product.name,
      description: product.description || product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category || '',
      brand: product.brand || '',
      image: product.image1Url || product.image1,
      images,
      stock: product.stock || 0,
      sku: product.sku || `SKU-${Date.now()}`,
      sizes: parseArray(product.sizes).length > 0 ? parseArray(product.sizes) : ['One Size'],
      colors: parseArray(product.colors),
      materials: parseArray(product.materials),
      patterns: parseArray(product.patterns),
      occasions: parseArray(product.occasions),
      genders: parseArray(product.genders),
      isFeatured: product.isFeatured || false,
      isNew: product.isNew || false,
      isSale: product.isSale || false,
      tags: parseArray(product.tags),
      isActive: true,
    };

    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
  };

  const handleUpload = async () => {
    if (products.length === 0) {
      toast.error('No products to upload');
      return;
    }

    setUploading(true);
    setProgress({ total: products.length, uploaded: 0, failed: 0, currentName: '' });
    setResults(null);

    const errors: string[] = [];
    const imageErrors: string[] = [];
    const productsWithMissingImages: string[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productNumber = i + 1;
      setProgress(prev => prev ? { ...prev, currentName: product.name } : null);

      try {
        let image1Url = product.image1;
        const allImages: string[] = [];
        let hasAtLeastOneImage = false;
        let missingImageCount = 0;

        // Upload Image 1 - REQUIRED
        if (product.image1 && product.image1.startsWith('http')) {
          try {
            image1Url = await uploadImageWithFallback(
              product.image1,
              product.brand,
              productNumber,
              '1'
            );
            allImages.push(image1Url);
            hasAtLeastOneImage = true;
          } catch (e: any) {
            const errorMsg = `Image 1 failed for "${product.name}": ${e.message}`;
            console.error(errorMsg);
            imageErrors.push(errorMsg);
            throw new Error(`Image 1 upload failed: ${e.message}`);
          }
        } else {
          throw new Error('Image 1 URL is missing or invalid');
        }

        // Upload Image 2 - OPTIONAL
        if (product.image2 && product.image2.startsWith('http')) {
          try {
            const imageUrl = await uploadImageWithFallback(
              product.image2,
              product.brand,
              productNumber,
              '2'
            );
            allImages.push(imageUrl);
          } catch (e: any) {
            const warnMsg = `Image 2 failed for "${product.name}": ${e.message}`;
            console.warn(warnMsg);
            imageErrors.push(warnMsg);
            missingImageCount++;
          }
        }

        // Upload extra images (Images 3, 4, 5) - OPTIONAL
        const extraImages = [product.image3, product.image4, product.image5].filter(Boolean);
        for (let j = 0; j < extraImages.length; j++) {
          const imgUrl = extraImages[j];
          if (imgUrl && imgUrl.startsWith('http')) {
            try {
              const uploadedUrl = await uploadImageWithFallback(
                imgUrl,
                product.brand,
                productNumber,
                String(j + 3)
              );
              allImages.push(uploadedUrl);
            } catch (e: any) {
              const warnMsg = `Image ${j + 3} failed for "${product.name}": ${e.message}`;
              console.warn(warnMsg);
              imageErrors.push(warnMsg);
              missingImageCount++;
            }
          }
        }

        if (!hasAtLeastOneImage) {
          throw new Error('No images available for this product');
        }

        // Track products with missing images
        if (missingImageCount > 0) {
          productsWithMissingImages.push(`${product.name} (missing ${missingImageCount} image(s), has ${allImages.length} image(s))`);
        }

        await createProduct({ ...product, image1Url: image1Url, allImages });
        setProgress(prev => prev ? { ...prev, uploaded: prev.uploaded + 1 } : null);
      } catch (error: any) {
        errors.push(`${product.name}: ${error.message}`);
        setProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
      }

      // Minimal delay to avoid rate limiting (reduced from 300ms to 50ms)
      if (i < products.length - 1) await new Promise(r => setTimeout(r, 50));
    }

    const finalProgress = {
      total: products.length,
      uploaded: products.length - errors.length,
      failed: errors.length,
      currentName: '',
    };
    setProgress(finalProgress);

    setResults({
      success: products.length - errors.length,
      failed: errors.length,
      errors,
      imageErrors: imageErrors.length > 0 ? imageErrors : undefined,
      productsWithMissingImages: productsWithMissingImages.length > 0 ? productsWithMissingImages : undefined,
    });

    setUploading(false);

    if (errors.length === 0 && imageErrors.length === 0) {
      toast.success(`✅ Successfully uploaded ${products.length} products!`);
    } else if (errors.length === 0) {
      toast.success(`✅ Uploaded ${products.length} products with ${imageErrors.length} image warning(s)`);
    } else {
      toast.warning(`Uploaded ${products.length - errors.length} products, ${errors.length} failed`);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Product Title': 'Embroidered Lawn Suit',
        'Description': 'Beautiful embroidered lawn suit with chiffon dupatta',
        'Price': 89,
        'Original Price': 120,
        'Category': 'Bridal Wear',
        'Brand': 'Gul Ahmed',
        'SKU': 'GA-LAWN-001',
        'Stock': 50,
        'Image 1': 'https://example.com/image-1.jpg',
        'Image 2': 'https://example.com/image-2.jpg',
        'Image 3': 'https://example.com/image-3.jpg',
        'Image 4': 'https://example.com/image-4.jpg',
        'Image 5': 'https://example.com/image-5.jpg',
        'Sizes': 'XS,S,M,L,XL',
        'Colors': 'Red,Gold,Green',
        'Materials': 'Cotton,Chiffon',
        'Patterns': 'Embroidered,Floral',
        'Occasions': 'Wedding,Festive',
        'Genders': 'Women',
        'Featured': 'true',
        'New': 'true',
        'Sale': 'false',
        'Tags': 'lawn,summer,embroidered',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'product-upload-template.xlsx');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bulk Product Upload</h1>
        <p className="text-gray-600 mt-1">Upload products from Excel file with automatic image processing</p>
      </div>

      {/* Download Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Step 1: Download Template
          </CardTitle>
          <CardDescription>
            Download the Excel template and fill in your product data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download Excel Template
          </Button>
        </CardContent>
      </Card>

      {/* Upload Excel File */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Step 2: Upload Excel File
          </CardTitle>
          <CardDescription>
            Required: Product Title, Image 1. Optional: Description, Price, Category, Brand, SKU, Stock, Images 2-5, Sizes, Colors, Materials, Patterns, Occasions, Genders, Featured, New, Sale, Tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gold/50 transition">
            <FileSpreadsheet className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {file ? file.name : 'Click to select Excel file'}
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Parsing Excel file...
            </div>
          )}

          {products.length > 0 && !uploading && (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">
                  {products.length} products ready to upload
                </span>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-300">
                Verified
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploading && progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Step 3: Uploading Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={(progress.uploaded / progress.total) * 100} />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{progress.total}</p>
                <p className="text-sm text-blue-700">Total</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{progress.uploaded}</p>
                <p className="text-sm text-green-700">Uploaded</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
                <p className="text-sm text-red-700">Failed</p>
              </div>
            </div>
            {progress.currentName && (
              <p className="text-sm text-gray-600">
                Processing: <span className="font-medium">{progress.currentName}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.failed === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                ✅ {results.success} Success
              </Badge>
              {results.failed > 0 && (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                  ❌ {results.failed} Failed
                </Badge>
              )}
            </div>

            {results.errors.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-sm mb-2">❌ Product Errors:</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {results.imageErrors && results.imageErrors.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-sm mb-2">⚠️ Image Upload Warnings ({results.imageErrors.length}):</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.imageErrors.slice(0, 10).map((error, index) => (
                    <p key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                      {error}
                    </p>
                  ))}
                  {results.imageErrors.length > 10 && (
                    <p className="text-sm text-gray-600 italic">
                      ...and {results.imageErrors.length - 10} more image errors
                    </p>
                  )}
                </div>
              </div>
            )}

            {results.productsWithMissingImages && results.productsWithMissingImages.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-sm mb-2">📷 Products with Partial Images ({results.productsWithMissingImages.length}):</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.productsWithMissingImages.map((product, index) => (
                    <p key={index} className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                      {product}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm sticky bottom-0 z-10">
        <div>
          {products.length > 0 && (
            <span className="text-sm font-medium text-gray-700">
              {uploading ? 'Uploading...' : `${products.length} products parsed`}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {products.length > 0 && !uploading && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setProducts([]);
                setResults(null);
                setProgress(null);
              }}
              className="gap-2"
            >
              Clear
            </Button>
          )}
          <Button
            onClick={handleUpload}
            className="bg-gold hover:bg-gold/90 gap-2 min-w-[200px]"
            disabled={products.length === 0 || uploading}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : `Upload ${products.length > 0 ? products.length : ''} Products`}
          </Button>
        </div>
      </div>
    </div>
  );
}
