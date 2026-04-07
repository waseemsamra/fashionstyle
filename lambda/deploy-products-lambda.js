#!/usr/bin/env node
// deploy-products-lambda.js - Deploy the products Lambda handler to AWS

const { LambdaClient, UpdateFunctionCodeCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const FUNCTION_NAME = process.env.FUNCTION_NAME || 'fashionstore-universal-products';
const REGION = process.env.AWS_REGION || 'us-east-1';

async function main() {
  console.log(`🚀 Deploying Lambda: ${FUNCTION_NAME}`);
  console.log(`📍 Region: ${REGION}`);

  const lambda = new LambdaClient({ region: REGION });

  // Create zip file
  const zipPath = path.join(__dirname, 'products-handler.zip');
  await createZip(path.join(__dirname, 'productsHandler.js'), zipPath);

  // Read zip file
  const zipBuffer = fs.readFileSync(zipPath);

  // Update Lambda code
  const command = new UpdateFunctionCodeCommand({
    FunctionName: FUNCTION_NAME,
    ZipFile: zipBuffer,
    Publish: true,
  });

  await lambda.send(command);

  console.log('✅ Lambda code updated successfully!');

  // Get and display function config
  const getConfig = new GetFunctionCommand({ FunctionName: FUNCTION_NAME });
  const config = await lambda.send(getConfig);
  console.log(`📦 Function ARN: ${config.Configuration.FunctionArn}`);
  console.log(`🕒 Last Modified: ${config.Configuration.LastModified}`);

  // Cleanup
  fs.unlinkSync(zipPath);
  console.log('🧹 Cleanup complete');
}

function createZip(sourceFile, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`📦 Created zip: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);
    archive.file(sourceFile, { name: 'index.js' });
    archive.finalize();
  });
}

main().catch(err => {
  console.error('❌ Deployment failed:', err);
  process.exit(1);
});
