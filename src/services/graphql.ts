// GraphQL service temporarily disabled - using REST API instead
// GraphQL queries are defined but not used until Amplify API is properly configured

export const graphqlService = {
  // Currently using REST API for products
  // GraphQL can be enabled after proper Amplify setup
  getProducts: async () => {
    throw new Error('GraphQL not configured - using REST API');
  },
  getProduct: async () => {
    throw new Error('GraphQL not configured - using REST API');
  },
};

export default graphqlService;
