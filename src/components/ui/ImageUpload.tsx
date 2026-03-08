import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImageToS3 } from '@/services/s3Upload';

interface ImageUploadProps {
  currentImage?: string;
  currentImages?: string[];
  onImageChange: (imageUrl: string) => void;
  onImagesChange?: (imageUrls: string[]) => void;
  multiple?: boolean;
  maxImages?: number;
  folder?: string;
  label?: string;
  accept?: string;
}

export default function ImageUpload({
  currentImage,
  currentImages = [],
  onImageChange,
  onImagesChange,
  multiple = false,
  maxImages = 5,
  folder = 'products',
  label = 'Product Image',
  accept = 'image/*'
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [previews, setPreviews] = useState<string[]>(currentImages || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);

      if (multiple && onImagesChange) {
        // Upload multiple images
        const newPreviews: string[] = [...previews];
        const newImageUrls: string[] = [...currentImages];

        for (const file of files) {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            alert('Please select image files only');
            continue;
          }

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            alert(`Image ${file.name} exceeds 5MB limit`);
            continue;
          }

          // Check max images limit
          if (newImageUrls.length >= maxImages) {
            alert(`Maximum ${maxImages} images allowed`);
            break;
          }

          // Upload to S3
          const uploadResult = await uploadImageToS3(file, folder);
          
          if (uploadResult.success) {
            newPreviews.push(uploadResult.imageUrl);
            newImageUrls.push(uploadResult.imageUrl);
            console.log('✅ Image uploaded:', uploadResult.imageUrl);
          } else {
            console.log('⚠️ Upload failed, using preview');
            const localUrl = URL.createObjectURL(file);
            newPreviews.push(localUrl);
          }
        }

        setPreviews(newPreviews);
        onImagesChange(newImageUrls);
      } else {
        // Upload single image
        const file = files[0];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file');
          setIsUploading(false);
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          setIsUploading(false);
          return;
        }

        // Upload to S3
        const uploadResult = await uploadImageToS3(file, folder);
        
        setPreview(uploadResult.imageUrl);
        onImageChange(uploadResult.imageUrl);

        if (uploadResult.success) {
          console.log('✅ Image uploaded to S3:', uploadResult.imageUrl);
        } else {
          console.log('⚠️ Using local preview:', uploadResult.message);
        }
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

  const handleRemoveImage = (index?: number) => {
    if (multiple && onImagesChange && index !== undefined) {
      const newPreviews = previews.filter((_, i) => i !== index);
      const newImageUrls = currentImages.filter((_, i) => i !== index);
      setPreviews(newPreviews);
      onImagesChange(newImageUrls);
    } else {
      setPreview('');
      onImageChange('');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // Multiple images mode
  if (multiple && onImagesChange) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {currentImages.length > 0 && `(${currentImages.length}/${maxImages})`}
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Existing Images */}
          {previews.map((imgUrl, index) => (
            <div key={index} className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 group">
              <img
                src={imgUrl}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(index);
                }}
                className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                  Main
                </span>
              )}
            </div>
          ))}

          {/* Upload Button */}
          {previews.length < maxImages && (
            <button
              type="button"
              onClick={handleClickUpload}
              disabled={isUploading}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <Plus className="w-8 h-8 mb-2" />
              <span className="text-xs font-medium">
                {isUploading ? 'Uploading...' : 'Add Image'}
              </span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || previews.length >= maxImages}
        />

        <p className="text-xs text-gray-500">
          Upload up to {maxImages} images • PNG, JPG, GIF up to 5MB • First image is main • Uploads to AWS S3
        </p>
      </div>
    );
  }

  // Single image mode (default)
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(undefined);
                }}
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
