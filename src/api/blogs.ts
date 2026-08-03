import { apiClient } from './client';

export interface Blog {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readingTime: number;
  publishedAt: string | null;
  content?: string; 
}

export const blogsApi = {
  getBlogs: async (limit: number = 9, offset: number = 0): Promise<Blog[]> => {
    const response = await apiClient.get(`/blogs?limit=${limit}&offset=${offset}`);
    return response.data;
  },
  getBlogBySlug: async (slug: string): Promise<Blog> => {
    const response = await apiClient.get(`/blogs/${slug}`);
    return response.data;
  }
};