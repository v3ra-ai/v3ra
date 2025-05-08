// fetchUtil.require('dotenv').config(); // Load environment variables from .env filejs
async function fetchFromOpenRouter(apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    throw error;
  }
}

// Example usage
async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY || 'your-api-key-here'; // Store API key in environment variables for security
  try {
    const result = await fetchFromOpenRouter(apiKey);
    console.log('API Response:', result);
  } catch {
    console.log('Failed to fetch data');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchFromOpenRouter };