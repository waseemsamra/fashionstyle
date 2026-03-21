import { S3Client, CreateBucketCommand, PutBucketPolicyCommand, PutBucketOwnershipControlsCommand } from '@aws-sdk/client-s3';
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

async function createBucket() {
  console.log('🚀 Creating S3 bucket...\n');
  console.log(`📦 Bucket Name: ${S3_BUCKET}`);
  console.log(`📍 Region: ${S3_REGION}\n`);

  try {
    // Create bucket (without ACL - will set ownership controls instead)
    const createCommand = new CreateBucketCommand({
      Bucket: S3_BUCKET,
    });

    await s3Client.send(createCommand);
    console.log('✅ Bucket created successfully!\n');

    // Set ownership controls to allow ACLs
    const ownershipCommand = new PutBucketOwnershipControlsCommand({
      Bucket: S3_BUCKET,
      OwnershipControls: {
        Rules: [{ ObjectOwnership: 'BucketOwnerPreferred' }],
      },
    });

    await s3Client.send(ownershipCommand);
    console.log('✅ Ownership controls set!\n');

  } catch (error) {
    if (error.name === 'BucketAlreadyOwnedByYou') {
      console.log('✅ Bucket already exists and is owned by you!\n');
    } else if (error.name === 'BucketAlreadyExists') {
      console.error('❌ Bucket name already exists. Please choose a different name.');
      console.error('   Update VITE_S3_BUCKET in your .env file\n');
      process.exit(1);
    } else {
      console.error('❌ Error creating bucket:', error.message);
      console.error('\n💡 The bucket may already exist. Let\'s try uploading anyway...\n');
    }
  }

  // Set bucket policy for public read access
  try {
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${S3_BUCKET}/*`],
        },
      ],
    };

    const policyCommand = new PutBucketPolicyCommand({
      Bucket: S3_BUCKET,
      Policy: JSON.stringify(bucketPolicy),
    });

    await s3Client.send(policyCommand);
    console.log('✅ Public read policy applied!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 S3 bucket is ready to use!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Next step: Run the upload script');
    console.log('   node upload-to-s3.js\n');

  } catch (error) {
    console.log('⚠️  Could not set bucket policy:', error.message);
    console.log('\n💡 You may need to set the bucket policy manually in the AWS Console.\n');
  }
}

createBucket();
