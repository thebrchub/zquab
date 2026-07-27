import { apiClient } from './client';

export const friendsApi = {
  getFriends: async (limit: number = 10, offset: number = 0) => {
    const res = await apiClient.get(`/friends?limit=${limit}&offset=${offset}`);
    return res.data;
  },
  
  // Note: Uses 'q=' instead of 'query=' as per API docs
  searchFriends: async (q: string) => {
    const res = await apiClient.get(`/friends/search?q=${encodeURIComponent(q)}`);
    return res.data;
  },
  
  getRequests: async (type: 'received' | 'sent' = 'received', limit: number = 10, offset: number = 0) => {
    const res = await apiClient.get(`/friends/requests?type=${type}&limit=${limit}&offset=${offset}`);
    return res.data;
  },
  
  sendRequest: async (username: string, premium: boolean = false) => {
    const res = await apiClient.post('/friends/request', { username, premium });
    return res.data;
  },
  
  acceptRequest: async (username: string) => {
    const res = await apiClient.post('/friends/accept', { username });
    return res.data;
  },
  
  rejectRequest: async (username: string) => {
    const res = await apiClient.post('/friends/reject', { username });
    return res.data;
  },
  
  withdrawRequest: async (username: string) => {
    const res = await apiClient.delete(`/friends/request/${encodeURIComponent(username)}`);
    return res.data;
  },
  
  removeFriend: async (username: string) => {
    const res = await apiClient.delete(`/friends/${encodeURIComponent(username)}`);
    return res.data;
  },
  
  blockUser: async (username: string) => {
    const res = await apiClient.post(`/friends/block/${encodeURIComponent(username)}`);
    return res.data;
  },
  
  unblockUser: async (username: string) => {
    const res = await apiClient.delete(`/friends/block/${encodeURIComponent(username)}`);
    return res.data;
  },
  
  getBlockedUsers: async (limit: number = 10, offset: number = 0) => {
    const res = await apiClient.get(`/friends/blocked?limit=${limit}&offset=${offset}`);
    return res.data;
  }
};