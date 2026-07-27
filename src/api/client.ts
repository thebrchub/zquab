// Define the base URL for local vs Vercel production
const HOST = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'https://api.zquab.com');

const API_BASE = `${HOST}/api/v1`;

// The core fetch logic handling credentials, headers, and errors
const fetchWrapper = async (endpoint: string, options: RequestInit = {}) => {
  // If endpoint is '/auth/guest', url becomes 'https://api.zquab.com/api/v1/auth/guest'
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Ensure cookies/sessions are sent cross-domain
  });

  if (!response.ok) {
    let message = 'API request failed';
    try {
      const errorData = await response.json();
      message = errorData.error || message;
    } catch {
      message = response.statusText;
    }
    throw new Error(message);
  }

  // Parse JSON (unless it's a 204 No Content response)
  const data = response.status === 204 ? null : await response.json();
  
  // Wrap the result in a "data" object so `res.data` works in your other files!
  return { data };
};

// Export the apiClient object matching the structure your other files expect
// Export the apiClient object matching the structure your other files expect
export const apiClient = {
  get: (endpoint: string) => fetchWrapper(endpoint, { method: 'GET' }),
  
  post: (endpoint: string, body?: any) => fetchWrapper(endpoint, { 
    method: 'POST', 
    body: body ? JSON.stringify(body) : undefined 
  }),
  
  put: (endpoint: string, body?: any) => fetchWrapper(endpoint, { 
    method: 'PUT', 
    body: body ? JSON.stringify(body) : undefined 
  }),

  // Added the missing patch method here!
  patch: (endpoint: string, body?: any) => fetchWrapper(endpoint, { 
    method: 'PATCH', 
    body: body ? JSON.stringify(body) : undefined 
  }),
  
  delete: (endpoint: string) => fetchWrapper(endpoint, { method: 'DELETE' }),
};