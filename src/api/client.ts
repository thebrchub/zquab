import axios from 'axios';

// Create a configured Axios instance
export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // CRITICAL: Ensures access_token cookies are sent/received
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept responses to normalize error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract the human-readable error message from the backend structure
    const message = error.response?.data?.error || 'An unexpected error occurred';
    
    // NOTE: A global check for 401 status can be added here later 
    // to force a re-authentication via AuthContext if the session expires.
    return Promise.reject(new Error(message));
  }
);