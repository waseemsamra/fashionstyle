import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const S3_BUCKET = 'fashionstore-products-1773891614';
const PUBLIC_FOLDER = path.join(__dirname, 'public');
const S3_FOLDER = 'images/';

// Initialize S3 client
const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// MIME types for images
const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

// Get all image files from public folder
function getImageFiles() {
  const files = fs.readdirSync(PUBLIC_FOLDER);
  return files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return mimeTypes[ext] !== undefined;
  });
}

// Upload a single file to S3
async function uploadFile(filename) {
  const filePath = path.join(PUBLIC_FOLDER, filename);
  const fileContent = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: S3_FOLDER + filename,
    Body: fileContent,
    ContentType: contentType,
    ACL: 'public-read', // Make the file publicly accessible
  });

  try {
    await s3Client.send(command);
    const url = `https://${S3_BUCKET}.s3.amazonaws.com/${S3_FOLDER}${filename}`;
    console.log(`✅ Uploaded: ${filename} → ${url}`);
    return { success: true, filename, url };
  } catch (error) {
    console.error(`❌ Failed to upload ${filename}:`, error.message);
    return { success: false, filename, error: error.message };
  }
}

// Main function
async function uploadAllImages() {
  console.log('');
  console.log('🚀 ============================================');
  console.log('🚀 Uploading Public Images to S3');
  console.log('🚀 ============================================');
  console.log(`📁 Source: ${PUBLIC_FOLDER}`);
  console.log(`📦 Bucket: ${S3_BUCKET}`);
  console.log(`📂 S3 Folder: ${S3_FOLDER}`);
  console.log('');

  // Check if AWS credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ Error: AWS credentials not found!');
    console.error('');
    console.error('Please set your AWS credentials:');
    console.error('  export AWS_ACCESS_KEY_ID="your-access-key"');
    console.error('  export AWS_SECRET_ACCESS_KEY="your-secret-key"');
    console.error('');
    console.error('Or create a .env file with these variables.');
    console.log('');
    process.exit(1);
  }

  const imageFiles = getImageFiles();

  if (imageFiles.length === 0) {
    console.log('⚠️  No image files found in public folder');
    console.log('');
    return;
  }

  console.log(`📸 Found ${imageFiles.length} image(s) to upload:`);
  imageFiles.forEach((file) => console.log(`   - ${file}`));
  console.log('');

  const results = { success: [], failed: [] };

  // Upload all images
  for (const file of imageFiles) {
    const result = await uploadFile(file);
    if (result.success) {
      results.success.push(result);
    } else {
      results.failed.push(result);
    }
  }

  // Summary
  console.log('');
  console.log('🚀 ============================================');
  console.log('🚀 Upload Summary');
  console.log('🚀 ============================================');
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('');

  if (results.success.length > 0) {
    console.log('📋 Uploaded files:');
    results.success.forEach((r) => {
      console.log(`   ${r.filename} → ${r.url}`);
    });
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('📋 Failed files:');
    results.failed.forEach((r) => {
      console.log(`   ${r.filename} - ${r.error}`);
    });
    console.log('');
  }

  console.log('🚀 ============================================');
  console.log('');
}

// Run the upload
uploadAllImages();
