import { S3Client, PutPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const S3_BUCKET = process.env.VITE_S3_BUCKET || 'fashionstore-products-1773891614v';
const S3_REGION = process.env.VITE_AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

async function disableBlockPublicAccess() {
  console.log('🔓 Disabling S3 Block Public Access...\n');
  console.log(`📦 Bucket: ${S3_BUCKET}\n`);

  try {
    const command = new PutPublicAccessBlockCommand({
      Bucket: S3_BUCKET,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    });

    await s3Client.send(command);

    console.log('✅ Block Public Access settings disabled!\n');
    console.log('⚠️  IMPORTANT: You must confirm this change in the AWS Console:\n');
    console.log('   1. Go to: https://console.aws.amazon.com/s3/buckets/' + S3_BUCKET);
    console.log('   2. Click "Permissions" tab');
    console.log('   3. Scroll to "Block public access"');
    console.log('   4. Click "Edit"');
    console.log('   5. Uncheck ALL 4 checkboxes');
    console.log('   6. Type "confirm" when prompted');
    console.log('   7. Click "Save changes"\n');
    console.log('After confirming, run: node upload-to-s3.js\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 You may need to disable Block Public Access manually in the AWS Console.');
    console.error('   Follow the steps above.\n');
    process.exit(1);
  }
}

disableBlockPublicAccess();
