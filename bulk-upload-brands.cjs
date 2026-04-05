// Bulk upload brands to DynamoDB using AWS CLI batch-write-item
// Usage: node bulk-upload-brands.cjs brands-data.json

const fs = require('fs');
const { execSync } = require('child_process');

const BRANDS_TABLE = 'fashionstore-brands';
const REGION = 'us-east-1';
const BATCH_SIZE = 25;

const brandsFile = process.argv[2] || 'brands-data.json';
const brands = JSON.parse(fs.readFileSync(brandsFile, 'utf8'));

if (!Array.isArray(brands) || brands.length === 0) {
  console.error('❌ No brands found. Provide a JSON file with brand array.');
  process.exit(1);
}

console.log(`📦 Uploading ${brands.length} brands to DynamoDB in batches of ${BATCH_SIZE}...\n`);

// Convert to DynamoDB typed format
function toDynamoDBItem(obj) {
  return {
    id: { S: obj.id },
    name: { S: obj.name },
    description: { S: obj.description || '' },
    logo: { S: obj.logo || '' },
    active: { BOOL: obj.active },
    products: { N: String(obj.products) },
    createdAt: { S: obj.createdAt },
    updatedAt: { S: obj.updatedAt }
  };
}

let success = 0;
let failed = 0;

for (let i = 0; i < brands.length; i += BATCH_SIZE) {
  const batch = brands.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(brands.length / BATCH_SIZE);

  const requestItems = {
    [BRANDS_TABLE]: batch.map(b => ({
      PutRequest: {
        Item: toDynamoDBItem({
          id: `brand-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: b.name,
          description: b.description || '',
          logo: b.logo || '',
          active: true,
          products: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }))
  };

  const file = `/tmp/brands-batch-${batchNum}.json`;
  fs.writeFileSync(file, JSON.stringify(requestItems));

  try {
    execSync(`aws dynamodb batch-write-item --request-items file://${file} --region ${REGION}`, { stdio: 'inherit' });
    console.log(`✅ Batch ${batchNum}/${totalBatches}: ${batch.length} brands`);
    success += batch.length;
  } catch (err) {
    console.error(`❌ Batch ${batchNum} failed`);
    failed += batch.length;
  }

  fs.unlinkSync(file);

  // Avoid throttling
  if (batchNum % 5 === 0) {
    const start = Date.now();
    while (Date.now() - start < 200) {}
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Done! ${success} uploaded, ${failed} failed out of ${brands.length}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
