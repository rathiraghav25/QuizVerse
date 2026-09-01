import apiClient from './api';
import type { Quiz, QuizCreatePayload, QuizPaginatedResponse, QuizDifficulty } from '../types';

export interface QuizListQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  category_id?: number;
  difficulty?: QuizDifficulty;
  is_published?: boolean;
}

export const quizService = {
  listQuizzes: async (params?: QuizListQueryParams): Promise<QuizPaginatedResponse> => {
    const response = await apiClient.get<QuizPaginatedResponse>('/quizzes', { params });
    return response.data;
  },

  getQuiz: async (id: number): Promise<Quiz> => {
    const response = await apiClient.get<Quiz>(`/quizzes/${id}`);
    return response.data;
  },

  createQuiz: async (payload: QuizCreatePayload): Promise<Quiz> => {
    const response = await apiClient.post<Quiz>('/quizzes', payload);
    return response.data;
  },

  updateQuiz: async (id: number, payload: Partial<QuizCreatePayload>): Promise<Quiz> => {
    const response = await apiClient.put<Quiz>(`/quizzes/${id}`, payload);
    return response.data;
  },

  togglePublish: async (id: number, is_published: boolean): Promise<Quiz> => {
    const response = await apiClient.patch<Quiz>(`/quizzes/${id}/publish`, { is_published });
    return response.data;
  },

  deleteQuiz: async (id: number): Promise<void> => {
    await apiClient.delete(`/quizzes/${id}`);
  },
};
