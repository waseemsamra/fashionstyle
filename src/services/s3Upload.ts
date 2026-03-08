import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';
const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL || `${API_URL}/generate-upload-url`;
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET || 'fashionstore-prod-assets-536217686312';
const S3_REGION = import.meta.env.VITE_S3_REGION || 'us-east-1';
const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

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
  folder: string = 'products'
): Promise<UploadResponse> => {
  try {
    console.log('📤 Getting presigned URL for upload...', file.name);
    console.log('📤 Upload API URL:', UPLOAD_API_URL);

    // Get auth token
    const token = localStorage.getItem('jwt_token');

    // Step 1: Get presigned URL from backend
    const presignedResponse = await axios.post<UploadResponse>(
      UPLOAD_API_URL,
      {
        fileName: file.name,
        fileType: file.type,
        folder: folder
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );

    console.log('✅ Presigned URL received:', presignedResponse.data.uploadUrl ? 'URL obtained' : 'No URL');

    const { uploadUrl, imageUrl, key } = presignedResponse.data;

    if (!uploadUrl) {
      throw new Error('No upload URL received from backend');
    }

    // Step 2: Upload directly to S3 using presigned URL
    console.log('📤 Uploading to S3...');
    console.log('📤 S3 Bucket:', S3_BUCKET);
    console.log('📤 Region:', S3_REGION);
    
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type
      }
    });

    console.log('✅ Image uploaded successfully to S3:', imageUrl);
    console.log('📤 Final Image URL:', imageUrl || `${S3_BASE_URL}/${key}`);
    
    return {
      success: true,
      imageUrl: imageUrl || `${S3_BASE_URL}/${key}`,
      key: key || `${folder}/${Date.now()}-${file.name}`,
      message: 'Upload successful'
    };

  } catch (error: any) {
    console.error('❌ Image upload failed:', error);
    console.error('❌ Error details:', error.response?.data || error.message);
    
    // Fallback: Return local preview URL
    const localUrl = URL.createObjectURL(file);
    return {
      success: false,
      imageUrl: localUrl,
      key: '',
      message: error.response?.data?.message || error.message || 'Upload failed, using local preview'
    };
  }
};

/**
 * Upload multiple images to S3
 */
export const uploadMultipleImages = async (
  files: File[],
  folder: string = 'products'
): Promise<UploadResponse[]> => {
  const results: UploadResponse[] = [];
  
  for (const file of files) {
    try {
      const result = await uploadImageToS3(file, folder);
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
