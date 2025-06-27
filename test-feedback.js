// Test feedback submission locally
const testFeedback = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'bug',
        message: 'Test feedback submission',
        email: 'test@example.com',
        browserInfo: {
          url: 'http://localhost:3000/test',
          userAgent: 'Test User Agent'
        }
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (!response.ok) {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};

testFeedback();