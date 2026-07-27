// Define the base URL exactly like you did in ChatClient
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'https://api.zquab.com');

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Prepend the base URL to all endpoints
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
      // If the response isn't JSON, just use the status text
      message = response.statusText;
    }
    throw new Error(message);
  }

  return response.json();
};