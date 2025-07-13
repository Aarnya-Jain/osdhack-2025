// Configuration for API endpoints
const config = {
  // Development: use proxy to localhost
  // Production: use deployed backend URL
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL || 'https://your-backend-url.railway.app'
    : '', // Empty string uses the proxy in package.json
};

export default config; 