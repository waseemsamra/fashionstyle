import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET || 'fashionstore-products-1773891614v';

interface ExcelProduct {
  name: string;
  brand: string;
  frontImageUrl: string;
  hoverImageUrl?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  price: number;
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

      // Map excel columns: Brand, Front-pic, Hover-pic, product_title, price
      const mappedProducts: ExcelProduct[] = jsonData.map((row: any) => ({
        name: row['product_title'] || row['Product Title'] || row['product title'] || row['name'] || '',
        brand: row['Brand'] || row['brand'] || '',
        frontImageUrl: row['Front-pic'] || row['Front pic'] || row['frontPic'] || row['image'] || '',
        hoverImageUrl: row['Hover-pic'] || row['Hover pic'] || row['hoverPic'] || '',
        image3: row['Image 3'] || row['image 3'] || '',
        image4: row['Image 4'] || row['image 4'] || '',
        image5: row['Image 5'] || row['image 5'] || '',
        price: parseFloat(row['price'] || row['Price'] || 0),
      }));

      const validProducts = mappedProducts.filter(p => p.name && p.brand);

      if (validProducts.length === 0) {
        toast.error('No valid products found. Required: Brand, Front pic, Product Title, Price');
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

  const uploadImageToS3 = async (imageUrl: string, brand: string, productNumber: number, imageNumber: string): Promise<string> => {
    const cleanBrand = brand.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const productNum = String(productNumber).padStart(4, '0');
    const fileName = `${cleanBrand}-${productNum}-${imageNumber}.jpg`;
    const key = `products/${fileName}`;

    // Get presigned URL
    const presignResponse = await fetch(`${API_URL}/admin/generate-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, contentType: 'image/jpeg' }),
    });

    if (!presignResponse.ok) {
      const errorText = await presignResponse.text().catch(() => '');
      throw new Error(`Failed to get upload URL (${presignResponse.status}): ${errorText}`);
    }

    const { uploadUrl } = await presignResponse.json();

    if (!uploadUrl) {
      throw new Error('No upload URL received from server');
    }

    // Download image from source URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from ${imageUrl} (HTTP ${imageResponse.status})`);
    }

    const imageBlob = await imageResponse.blob();

    // Verify it's actually an image
    if (!imageBlob.type.startsWith('image/')) {
      throw new Error(`Downloaded file is not an image: ${imageBlob.type}`);
    }

    // Upload to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: imageBlob,
      headers: { 'Content-Type': 'image/jpeg' },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      throw new Error(`Failed to upload to S3 (${uploadResponse.status}): ${errorText}`);
    }

    return `https://${S3_BUCKET}.s3.us-east-1.amazonaws.com/${key}`;
  };

  const createProduct = async (product: ExcelProduct & { allImages?: string[] }): Promise<void> => {
    const images = product.allImages && product.allImages.length > 0
      ? product.allImages
      : [product.frontImageUrl];

    const productData = {
      name: product.name,
      brand: product.brand,
      category: '',
      price: product.price,
      stock: 0,
      sku: `SKU-${Date.now()}`,
      description: product.name,
      image: product.frontImageUrl,
      images,
      sizes: ['One Size'],
      colors: [],
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
        let frontImageUrl = product.frontImageUrl;
        const allImages: string[] = [];
        let hasAtLeastOneImage = false;
        let missingImageCount = 0;

        // Upload front image (image 1) - REQUIRED
        if (product.frontImageUrl && product.frontImageUrl.startsWith('http')) {
          try {
            frontImageUrl = await uploadImageToS3(product.frontImageUrl, product.brand, productNumber, '1');
            allImages.push(frontImageUrl);
            hasAtLeastOneImage = true;
          } catch (e: any) {
            const errorMsg = `Front image failed for "${product.name}": ${e.message}`;
            console.error(errorMsg);
            imageErrors.push(errorMsg);
            // Front image is required - skip this product if it fails
            throw new Error(`Front image upload failed: ${e.message}`);
          }
        } else {
          throw new Error('Front image URL is missing or invalid');
        }

        // Upload hover image (image 2) - OPTIONAL
        if (product.hoverImageUrl && product.hoverImageUrl.startsWith('http')) {
          try {
            const hoverUrl = await uploadImageToS3(product.hoverImageUrl, product.brand, productNumber, '2');
            allImages.push(hoverUrl);
          } catch (e: any) {
            const warnMsg = `Hover image failed for "${product.name}": ${e.message}`;
            console.warn(warnMsg);
            imageErrors.push(warnMsg);
            missingImageCount++;
            // Continue without hover image
          }
        }

        // Upload extra images (images 3, 4, 5) - OPTIONAL
        const extraImages = [product.image3, product.image4, product.image5].filter(Boolean);
        for (let j = 0; j < extraImages.length; j++) {
          const imgUrl = extraImages[j];
          if (imgUrl && imgUrl.startsWith('http')) {
            try {
              const uploadedUrl = await uploadImageToS3(imgUrl, product.brand, productNumber, String(j + 3));
              allImages.push(uploadedUrl);
            } catch (e: any) {
              const warnMsg = `Image ${j + 3} failed for "${product.name}": ${e.message}`;
              console.warn(warnMsg);
              imageErrors.push(warnMsg);
              missingImageCount++;
              // Continue without this image
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

        await createProduct({ ...product, frontImageUrl, allImages });
        setProgress(prev => prev ? { ...prev, uploaded: prev.uploaded + 1 } : null);
      } catch (error: any) {
        errors.push(`${product.name}: ${error.message}`);
        setProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
      }

      if (i < products.length - 1) await new Promise(r => setTimeout(r, 300));
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
        'Brand': 'Gul Ahmed',
        'Front pic': 'https://example.com/front-image.jpg',
        'Hover-pic': 'https://example.com/hover-image.jpg',
        'Image 3': '',
        'Image 4': '',
        'Image 5': '',
        'Product Title': 'Embroidered Lawn Suit',
        'Price': 89,
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
            Required: Brand, Front pic, Product Title, Price. Optional: Hover-pic, Image 3, Image 4, Image 5
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
