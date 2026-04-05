// Bulk upload brands directly to DynamoDB via AWS CLI
// Usage: node bulk-upload-brands.js brands-data.json
// This generates a bash script that uses AWS CLI (already configured)

import fs from 'fs';
import { execSync } from 'child_process';

const BRANDS_TABLE = 'fashionstore-brands';
const REGION = 'us-east-1';

const brandsFile = process.argv[2] || 'brands-data.json';
const brands = JSON.parse(fs.readFileSync(brandsFile, 'utf8'));

if (!Array.isArray(brands) || brands.length === 0) {
  console.error('❌ No brands found. Provide a JSON file with brand array.');
  process.exit(1);
}

console.log(`📦 Uploading ${brands.length} brands to DynamoDB...\n`);

// Write items individually via CLI
let success = 0;
let failed = 0;
const BATCH = 50;

for (let i = 0; i < brands.length; i += BATCH) {
  const batch = brands.slice(i, i + BATCH);
  const batchNum = Math.floor(i / BATCH) + 1;
  const totalBatches = Math.ceil(brands.length / BATCH);

  // Build batch write JSON
  const requestItems = {
    [BRANDS_TABLE]: batch.map(b => ({
      PutRequest: {
        Item: {
          id: `brand-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: b.name,
          description: b.description || '',
          logo: b.logo || '',
          active: true,
          products: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    }))
  };

  const json = JSON.stringify(requestItems);
  const file = `/tmp/brands-batch-${batchNum}.json`;
  fs.writeFileSync(file, json);

  try {
    execSync(`aws dynamodb batch-write-item --request-items file://${file} --region ${REGION}`, { stdio: 'inherit' });
    console.log(`✅ Batch ${batchNum}/${totalBatches}: ${batch.length} brands`);
    success += batch.length;
  } catch (err) {
    console.error(`❌ Batch ${batchNum} failed`);
    failed += batch.length;
  }

  fs.unlinkSync(file);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Done! ${success} uploaded, ${failed} failed out of ${brands.length}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
