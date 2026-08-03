import { apiClient } from './client';

export const usersApi = {
  getMe: async () => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },
  
  updateMePartial: async (data: { username?: string; name?: string; mobile?: string; gender?: string; avatar_url?: string; show_last_seen?: boolean; bio?: string; country?: string }) => {
    const res = await apiClient.patch('/users/me', data);
    return res.data;
  },
  
  // Requires username and name
  updateMeFull: async (data: { username: string; name: string; mobile?: string; gender?: string; avatar_url?: string; show_last_seen?: boolean; bio?: string; country?: string }) => {
    const res = await apiClient.put('/users/me', data);
    return res.data;
  },
  
  // Note: Uses 'query=' as per API docs
  search: async (query: string) => {
    const res = await apiClient.get(`/users/search?query=${encodeURIComponent(query)}`);
    return res.data;
  },
  
  checkUsername: async (username: string) => {
    const res = await apiClient.get(`/users/check-username?username=${encodeURIComponent(username)}`);
    return res.data;
  },
  
  getUserProfile: async (username: string) => {
    const res = await apiClient.get(`/users/${encodeURIComponent(username)}`);
    return res.data;
  },

  searchUsers: async (query: string) => {
    // The API guide specifies the param is 'query', not 'q'
    const response = await apiClient.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data; 
  },

  // 🛠️ ADDED: Fetch public friends list for a specific user
  getUserFriends: async (username: string) => {
    const response = await apiClient.get(`/users/${encodeURIComponent(username)}/friends`);
    return response.data;
  }
};