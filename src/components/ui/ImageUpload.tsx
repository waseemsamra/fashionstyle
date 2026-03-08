import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImageToS3 } from '@/services/s3Upload';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  folder?: string;
  label?: string;
  accept?: string;
}

export default function ImageUpload({
  currentImage,
  onImageChange,
  folder = 'products',
  label = 'Product Image',
  accept = 'image/*'
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);

      // Upload to S3
      const uploadResult = await uploadImageToS3(file, folder);
      
      // Set preview and return URL
      setPreview(uploadResult.imageUrl);
      onImageChange(uploadResult.imageUrl);

      if (uploadResult.success) {
        console.log('✅ Image uploaded to S3:', uploadResult.imageUrl);
      } else {
        console.log('⚠️ Using local preview:', uploadResult.message);
      }
    } catch (error) {
      console.error('❌ Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className="flex items-start gap-4">
        {/* Image Preview */}
        <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={handleClickUpload}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading to S3...' : preview ? 'Change Image' : 'Upload Image'}
          </Button>

          <p className="mt-2 text-xs text-gray-500">
            PNG, JPG, GIF up to 5MB • Uploads to AWS S3
          </p>
        </div>
      </div>
    </div>
  );
}
