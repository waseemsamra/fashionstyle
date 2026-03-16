/**
 * API Error Interceptor for Development
 * 
 * This module intercepts all fetch requests in development mode
 * and logs detailed error information for failed API requests.
 * 
 * Usage: Import this file in main.tsx to enable automatic error logging.
 */

if (import.meta.env.DEV) {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const response = await originalFetch(...args);
      
      if (!response.ok) {
        console.error('❌ API Error:', {
          url: args[0] instanceof Request ? args[0].url : String(args[0]),
          status: response.status,
          statusText: response.statusText,
          method: args[1]?.method || 'GET',
        });
        
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        try {
          const errorBody = await clonedResponse.text();
          
          // Try to parse as JSON for better formatting
          try {
            const jsonBody = JSON.parse(errorBody);
            console.error('Error body:', JSON.stringify(jsonBody, null, 2));
          } catch {
            console.error('Error body:', errorBody);
          }
        } catch (e) {
          console.error('Could not read error body');
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error;
    }
  };
}

// No export needed - this module runs as a side effect when imported
