// Lambda function to download image from URL and upload to S3
const AWS = require('aws-sdk');
const https = require('https');
const http = require('http');

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET || 'fashionstore-products-1773891614v';

exports.handler = async (event) => {
  try {
    const { imageUrl, s3Key } = JSON.parse(event.body);
    
    if (!imageUrl || !s3Key) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'imageUrl and s3Key are required' })
      };
    }

    console.log(`📥 Downloading image from: ${imageUrl}`);
    console.log(`📤 Uploading to S3: ${BUCKET_NAME}/${s3Key}`);

    // Download image from URL
    const imageBuffer = await downloadImage(imageUrl);
    
    if (!imageBuffer || imageBuffer.length < 100) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Invalid image or file too small' })
      };
    }

    console.log(`✅ Downloaded: ${imageBuffer.length} bytes`);

    // Upload to S3
    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    }).promise();

    const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
    
    console.log(`✅ Uploaded to S3: ${s3Url}`);

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        success: true,
        imageUrl: s3Url,
        s3Key: s3Key,
        size: imageBuffer.length
      })
    };
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        error: error.message,
        success: false
      })
    };
  }
};

// Download image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageDownloader/1.0)',
        'Accept': 'image/*,*/*;q=0.8'
      },
      timeout: 10000
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`🔄 Redirecting to: ${redirectUrl}`);
        return downloadImage(redirectUrl).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

// CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };
}
