console.log('Testing frontend environment variables...');
console.log('VITE_STREAM_API_KEY:', import.meta.env.VITE_STREAM_API_KEY);
console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('All env vars:', import.meta.env);

// Test fetch to backend
fetch('http://localhost:3000')
    .then(response => response.json())
    .then(data => console.log('Backend test successful:', data))
    .catch(error => console.error('Backend test failed:', error));