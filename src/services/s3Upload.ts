import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws';
const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL || 'https://4dzwj3v7m4mm2ij7q5eibkbdlq0tynyd.lambda-url.us-east-1.on.aws';
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET || 'fashionstore-products-1773891614v';
const S3_REGION = import.meta.env.VITE_S3_REGION || 'us-east-1';
const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com';

export interface UploadResponse {
  success: boolean;
  imageUrl: string;
  key: string;
  uploadUrl?: string;
  message?: string;
}

/**
 * Get presigned URL from backend and upload to S3
 */
export const uploadImageToS3 = async (
  file: File,
  folder: string = 'products',
  categoryName: string = '',
  isCategory: boolean = false
): Promise<UploadResponse> => {
  try {
    console.log('📤 Getting presigned URL for upload...', file.name);
    console.log('📤 Upload API URL:', UPLOAD_API_URL);

    // Construct filename with category- prefix for category uploads
    let filename = file.name;
    if (isCategory && categoryName) {
      // Convert "Accessories" to "category-accessories.jpg"
      const safeName = categoryName.toLowerCase().replace(/\s+/g, '-');
      if (!file.name.startsWith('category-')) {
        filename = `category-${safeName}.jpg`;
      }
    }

    // Step 1: Get presigned URL from backend using fetch
    const presignedResponse = await fetch(UPLOAD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'categoryName': categoryName  // Send category name in header for backend processing
      },
      body: JSON.stringify({
        filename: filename,
        contentType: file.type,
        folder: folder
      })
    });

    console.log('📤 Presigned response status:', presignedResponse.status);

    if (!presignedResponse.ok) {
      const errorText = await presignedResponse.text();
      throw new Error(`HTTP ${presignedResponse.status}: ${errorText}`);
    }

    const presignedData = await presignedResponse.json();
    console.log('✅ Presigned URL received:', presignedData.uploadUrl ? 'URL obtained' : 'No URL');

    const { uploadUrl, imageUrl, key } = presignedData;

    if (!uploadUrl) {
      throw new Error('No upload URL received from backend');
    }

    // Step 2: Upload directly to S3 using presigned URL
    console.log('📤 Uploading to S3...');
    console.log('📤 S3 Bucket:', S3_BUCKET);
    console.log('📤 Region:', S3_REGION);
    
    const s3Response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!s3Response.ok) {
      throw new Error(`S3 upload failed: ${s3Response.status}`);
    }

    console.log('✅ Image uploaded successfully to S3:', imageUrl);
    console.log('📤 Final Image URL:', imageUrl || `${S3_BASE_URL}/${key}`);
    
    // For category uploads, ensure the URL matches S3 structure
    let finalImageUrl = imageUrl || `${S3_BASE_URL}/${key}`;
    if (isCategory && categoryName) {
      // Ensure the saved path is: categories/category-{name}.jpg
      const safeName = categoryName.toLowerCase().replace(/\s+/g, '-');
if (!finalImageUrl.includes(`category-${safeName}`) && 'categories/' in finalImageUrl) {
         finalImageUrl = `https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/categories/category-${safeName}.jpg`;
       }
    }
    
    return {
      success: true,
      imageUrl: finalImageUrl,
      key: key || `${folder}/${Date.now()}-${file.name}`,
      message: 'Upload successful'
    };

  } catch (error: any) {
    console.error('❌ Image upload failed:', error);
    console.error('❌ Error details:', error.message);
    
    // Fallback: Return local preview URL for preview purposes
    const localUrl = URL.createObjectURL(file);
    return {
      success: false,
      imageUrl: localUrl,
      key: '',
      message: error.message || 'Upload failed, using local preview'
    };
  }
};

/**
 * Upload multiple images to S3
 */
export const uploadMultipleImages = async (
  files: File[],
  folder: string = 'products',
  isCategory: boolean = false
): Promise<UploadResponse[]> => {
  const results: UploadResponse[] = [];
  
  for (const file of files) {
    try {
      const result = await uploadImageToS3(file, folder, '', isCategory);
      results.push(result);
    } catch (error) {
      console.error('Failed to upload file:', file.name);
      results.push({
        success: false,
        imageUrl: '',
        key: '',
        message: 'Upload failed'
      });
    }
  }
  
  return results;
};

/**
 * Delete image from S3
 */
export const deleteImageFromS3 = async (imageKey: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('jwt_token');
    
    await axios.delete(
      `${API_URL}/upload/${encodeURIComponent(imageKey)}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );
    
    console.log('✅ Image deleted from S3:', imageKey);
    return true;
  } catch (error) {
    console.error('❌ Failed to delete image:', error);
    return false;
  }
};

/**
 * Get S3 image URL from key
 */
export const getS3ImageUrl = (key: string): string => {
  if (!key) return '';
  
  // If it's already a full URL, return as is
  if (key.startsWith('http')) {
    return key;
  }
  
  // Construct S3 URL
  return `https://${S3_BUCKET}.s3.us-east-1.amazonaws.com/${key}`;
};
