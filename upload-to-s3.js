import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// S3 Configuration
const S3_BUCKET = process.env.VITE_S3_BUCKET || 'fashionstore-products-1773891614v';
const S3_REGION = process.env.VITE_AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Validate credentials
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || 
    AWS_ACCESS_KEY_ID === 'your-access-key-id' || 
    AWS_SECRET_ACCESS_KEY === 'your-secret-access-key') {
  console.error('❌ AWS credentials not configured!');
  console.error('');
  console.error('Please update your .env file with your AWS credentials:');
  console.error('  AWS_ACCESS_KEY_ID=your-actual-access-key');
  console.error('  AWS_SECRET_ACCESS_KEY=your-actual-secret-key');
  console.error('');
  console.error('You can find your credentials in the AWS Console:');
  console.error('  1. Go to IAM Console');
  console.error('  2. Create a user with S3 permissions');
  console.error('  3. Create access keys');
  console.error('  4. Update the .env file');
  process.exit(1);
}

// Public folder path
const PUBLIC_FOLDER = join(__dirname, 'public');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

// Initialize S3 Client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

async function uploadImages() {
  console.log('🚀 Starting image upload to S3...\n');
  console.log(`📦 Bucket: ${S3_BUCKET}`);
  console.log(`📁 Source: ${PUBLIC_FOLDER}\n`);

  try {
    // Read public folder
    const files = await readdir(PUBLIC_FOLDER);
    
    // Filter image files
    const imageFiles = files.filter(file => 
      IMAGE_EXTENSIONS.includes(extname(file).toLowerCase())
    );

    if (imageFiles.length === 0) {
      console.log('❌ No image files found in public folder.');
      return;
    }

    console.log(`📸 Found ${imageFiles.length} images to upload:\n`);

    let uploaded = 0;
    let failed = 0;

    for (const file of imageFiles) {
      const filePath = join(PUBLIC_FOLDER, file);
      const fileContent = await readFile(filePath);
      
      // Determine content type based on extension
      const ext = extname(file).toLowerCase();
      const contentType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
      }[ext] || 'application/octet-stream';

      try {
        const command = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: file, // Upload to root of bucket
          Body: fileContent,
          ContentType: contentType,
          ACL: 'public-read', // Make images publicly accessible
        });

        await s3Client.send(command);
        
        const s3Url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${file}`;
        console.log(`✅ Uploaded: ${file}`);
        console.log(`   URL: ${s3Url}\n`);
        
        uploaded++;
      } catch (error) {
        console.error(`❌ Failed to upload: ${file}`);
        console.error(`   Error: ${error.message}\n`);
        failed++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Upload Summary:`);
    console.log(`   ✅ Successful: ${uploaded}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📁 Total: ${imageFiles.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (uploaded > 0) {
      console.log('💡 Next steps:');
      console.log('   Run the following command to update your code:');
      console.log('   node update-image-paths-to-s3.js\n');
    }

  } catch (error) {
    console.error('❌ Error during upload:', error.message);
    if (error.name === 'CredentialsProviderError') {
      console.error('');
      console.error('🔐 Credentials Error: Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
    }
    process.exit(1);
  }
}

// Run the upload
uploadImages();
