import { apiClient } from './client';

export const roomsApi = {
  // cursor = RFC3339 timestamp to page from
  getRooms: async (cursor?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());
    
    const res = await apiClient.get(`/rooms?${params.toString()}`);
    return res.data;
  },
  
  createRoom: async (username: string) => {
    const res = await apiClient.post('/rooms', { username });
    return res.data;
  },
  
  getRequests: async (cursor?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());
    
    const res = await apiClient.get(`/rooms/requests?${params.toString()}`);
    return res.data;
  },
  
  acceptRequest: async (roomId: string) => {
    const res = await apiClient.post(`/rooms/${roomId}/accept`);
    return res.data;
  },
  
  rejectRequest: async (roomId: string) => {
    const res = await apiClient.post(`/rooms/${roomId}/reject`);
    return res.data;
  },
  
  // cursor = message ID to page before
  getMessages: async (roomId: string, cursor?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());
    
    const res = await apiClient.get(`/rooms/${roomId}/messages?${params.toString()}`);
    return res.data;
  }
};