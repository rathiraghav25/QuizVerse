import apiClient from './api';
import type { Category, CategoryCreatePayload } from '../types';

export const categoryService = {
  listCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },

  createCategory: async (payload: CategoryCreatePayload): Promise<Category> => {
    const response = await apiClient.post<Category>('/categories', payload);
    return response.data;
  },

  updateCategory: async (id: number, payload: Partial<CategoryCreatePayload>): Promise<Category> => {
    const response = await apiClient.put<Category>(`/categories/${id}`, payload);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
