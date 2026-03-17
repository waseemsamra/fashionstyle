import { Amplify } from 'aws-amplify';

// Configure Amplify with Cognito and GraphQL (AppSync)
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || 'us-east-1_qavi3JAVz',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '2o9mbemohjr2re5qd0o045gir0',
      // Remove identityPoolId if not using AWS resources
    }
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_GRAPHQL_URL || 'https://5wclz64wkfgp3h3exivmggigvu.appsync-api.us-east-1.amazonaws.com/graphql',
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      defaultAuthMode: 'apiKey' as any,
      apiKey: import.meta.env.VITE_GRAPHQL_API_KEY || 'da2-aadwbwrozrfgriafn6pgjjhrca',
    },
  },
});

export default Amplify;
