// Check environment variables before build
console.log('\n===== CHECKING ENVIRONMENT VARIABLES =====');

// Check API key
const apiKey = process.env.PUBLIC_API_KEY;

if (!apiKey) {
  console.error('❌ ERROR: PUBLIC_API_KEY is not set!');
  console.error('Please set the API_KEY environment variable in Render.com dashboard.');
  process.exit(1); // Exit with error code
} else if (apiKey === 'dev-api-key-change-in-production') {
  console.warn('⚠️ WARNING: You are using the default development API key.');
  console.warn('This should not be used in production!');
} else {
  console.log('✅ API key is set correctly. First chars:', apiKey.substring(0, 5) + '...');
  console.log('✅ API key length:', apiKey.length);
}

// Check API base URL
const apiBaseUrl = process.env.PUBLIC_API_BASE_URL;
if (!apiBaseUrl) {
  console.warn('⚠️ WARNING: PUBLIC_API_BASE_URL is not set. Will use default URL.');
} else {
  console.log('✅ API base URL is set to:', apiBaseUrl);
}

console.log('===== ENVIRONMENT CHECK COMPLETE =====\n'); 