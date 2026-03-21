// Test Lambda connectivity
import { getLambdaClient, LAMBDA_FUNCTIONS } from './lambdaClient';

export const testLambdaConnection = async () => {
  console.log('🔍 Testing Lambda connection...');
  
  try {
    // Check if tokens exist
    const idToken = localStorage.getItem('idToken');
    const jwtToken = localStorage.getItem('jwt_token');
    const accessToken = localStorage.getItem('accessToken');
    
    console.log('📋 Token Check:');
    console.log('  - ID Token:', idToken ? '✅ Exists (' + idToken.substring(0, 50) + '...)' : '❌ Missing');
    console.log('  - JWT Token:', jwtToken ? '✅ Exists' : '❌ Missing');
    console.log('  - Access Token:', accessToken ? '✅ Exists' : '❌ Missing');
    
    if (!idToken && !jwtToken) {
      console.error('❌ ERROR: No authentication token found! Please login first.');
      return {
        success: false,
        error: 'No token found - please login',
      };
    }
    
    // Try to get Lambda client
    console.log('\n🔮 Getting Lambda client...');
    const client = await getLambdaClient();
    console.log('✅ Lambda client created');
    
    // Try to invoke products Lambda
    console.log('\n📦 Testing Products Lambda...');
    const { InvokeCommand } = await import('@aws-sdk/client-lambda');
    
    const command = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTIONS.PRODUCTS,
      Payload: JSON.stringify({
        httpMethod: 'GET',
        path: '/products',
        queryStringParameters: { limit: '5' },
      }),
    });
    
    const response = await client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    console.log('✅ Products Lambda response:', result);
    console.log('📊 Products count:', result.items?.length || result.length || 0);
    
    return {
      success: true,
      tokenFound: !!(idToken || jwtToken),
      lambdaWorking: true,
      productsCount: result.items?.length || result.length || 0,
    };
  } catch (error: any) {
    console.error('❌ Lambda test failed:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.$metadata || error.code);
    
    return {
      success: false,
      error: error.message,
      errorCode: error.name,
    };
  }
};
