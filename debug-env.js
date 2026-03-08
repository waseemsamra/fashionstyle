// Debug script to check environment variables
// Run this in your browser console on Amplify site

console.log('=== ENVIRONMENT DEBUG ===');
console.log('VITE_API_URL:', import.meta.env?.VITE_API_URL);
console.log('Expected: https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod');
console.log('');

// Test direct fetch
console.log('Testing direct fetch...');
fetch('https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/products')
  .then(r => r.text())
  .then(text => {
    console.log('Response length:', text.length);
    console.log('First 200 chars:', text.substring(0, 200));
    
    try {
      const json = JSON.parse(text);
      console.log('✅ Valid JSON!');
      console.log('Products count:', json.items?.length || 0);
    } catch (e) {
      console.log('❌ Not JSON - it\'s HTML!');
      console.log('This means CORS is blocking the request');
    }
  })
  .catch(err => {
    console.error('❌ Fetch error:', err.message);
  });
