import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const S3_BUCKET = process.env.VITE_S3_BUCKET || 'fashionstore-products-1773891614v';
const S3_REGION = process.env.VITE_AWS_REGION || 'us-east-1';
const S3_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

const filesToUpdate = [
  'src/data/products.ts',
  'src/components/sections/Hero.tsx',
  'src/components/sections/About.tsx',
];

async function updateFile(filePath) {
  const fullPath = join(__dirname, filePath);
  
  try {
    let content = await readFile(fullPath, 'utf-8');
    const originalContent = content;
    
    // Replace local image paths with S3 URLs
    // Match patterns like: src="/hero-image.jpg" or image: '/product-1.jpg'
    content = content.replace(
      /(src=|image:|avatar:|logo:|coverImage:)\s*["']\/([^"']+\.(jpg|jpeg|png|gif|svg|webp))["']/g,
      `$1"${S3_URL}/$2"`
    );
    
    if (content !== originalContent) {
      await writeFile(fullPath, content, 'utf-8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔄 Updating image paths to use S3...\n');
  console.log(`📦 S3 Bucket: ${S3_BUCKET}`);
  console.log(`🌐 S3 URL: ${S3_URL}\n`);
  
  let updated = 0;
  
  for (const file of filesToUpdate) {
    const result = await updateFile(file);
    if (result) updated++;
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Updated ${filesToUpdate.length} files, ${updated} changed`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (updated > 0) {
    console.log('💡 Remember to rebuild your app:');
    console.log('   npm run build\n');
  }
}

main();
