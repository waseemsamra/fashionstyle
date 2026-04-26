const API_URL = import.meta.env.VITE_API_URL || 'https://zbdw3piterihfqm37o3swldeca0qitsj.lambda-url.us-east-1.on.aws';
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET || 'fashionstore-products-1773891614v';
const S3_REGION = 'us-east-1';

export const downloadAndUploadImage = async (
  imageUrl: string,
  brand: string,
  productNumber: number,
  imageNumber: string
): Promise<string> => {
  const cleanBrand = brand.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const productNum = String(productNumber).padStart(4, '0');
  const fileName = `${cleanBrand}-${productNum}-${imageNumber}.jpg`;
  const s3Key = `products/${fileName}`;

  // Convert redirect URLs to direct URLs
  let cleanUrl = imageUrl.trim();
  cleanUrl = cleanUrl.replace('https://go.sanaullastore.com', 'https://sanaullastore.com')
                     .replace('http://go.sanaullastore.com', 'https://sanaullastore.com');

  console.log(`📥 Downloading image: ${cleanUrl}`);
  console.log(`📤 S3 Key: ${s3Key}`);

  const token = localStorage.getItem('jwt_token');

  // Try backend first (if CORS is enabled)
  try {
    const response = await fetch(`${API_URL}/download-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        imageUrl: cleanUrl,
        s3Key: s3Key
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Successfully uploaded via backend: ${result.imageUrl}`);
        return result.imageUrl;
      }
    }
  } catch (err) {
    console.warn('⚠️ Backend download failed, using direct fetch');
  }

  // Fallback: Direct browser fetch → S3 presigned URL
  console.log('🔄 Using direct browser upload fallback...');
  return await uploadViaPresignedUrl(cleanUrl, brand, productNumber, imageNumber);
};

// Fallback: Try backend first, then S3 upload if that fails
export const uploadImageWithFallback = async (
  imageUrl: string,
  brand: string,
  productNumber: number,
  imageNumber: string
): Promise<string> => {
  try {
    // Try backend download first with timeout
    return await Promise.race([
      downloadAndUploadImage(imageUrl, brand, productNumber, imageNumber),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Backend upload timeout (15s)')), 15000)
      ),
    ]);
  } catch (backendError: any) {
    console.warn(`⚠️ Backend download failed, trying S3 presigned upload: ${backendError.message}`);

    // Fallback to original S3 presigned URL method
    return await uploadViaPresignedUrl(imageUrl, brand, productNumber, imageNumber);
  }
};

// Original presigned URL method as fallback
const uploadViaPresignedUrl = async (
  imageUrl: string,
  brand: string,
  productNumber: number,
  imageNumber: string
): Promise<string> => {
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
    throw new Error(`Failed to get upload URL`);
  }

  const { uploadUrl } = await presignResponse.json();

  // Download image
  let cleanUrl = imageUrl.trim();
  cleanUrl = cleanUrl.replace('https://go.sanaullastore.com', 'https://sanaullastore.com')
                     .replace('http://go.sanaullastore.com', 'https://sanaullastore.com');

  const imageResponse = await fetch(cleanUrl, { mode: 'cors' });
  if (!imageResponse.ok) {
    throw new Error(`Failed to download: HTTP ${imageResponse.status}`);
  }

  const imageBlob = await imageResponse.blob();

  // Upload to S3
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: imageBlob,
    headers: { 'Content-Type': 'image/jpeg' },
  });

  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed`);
  }

  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
};
