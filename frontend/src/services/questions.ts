import apiClient from './api';
import type { Question, QuestionCreatePayload } from '../types';

export interface QuestionReorderItem {
  question_id: number;
  order: number;
}

export const questionService = {
  getQuizQuestions: async (quizId: number): Promise<Question[]> => {
    const response = await apiClient.get<Question[]>(`/quizzes/${quizId}/questions`);
    return response.data;
  },

  addQuestion: async (quizId: number, payload: QuestionCreatePayload): Promise<Question> => {
    const response = await apiClient.post<Question>(`/quizzes/${quizId}/questions`, payload);
    return response.data;
  },

  updateQuestion: async (id: number, payload: Partial<QuestionCreatePayload>): Promise<Question> => {
    const response = await apiClient.put<Question>(`/questions/${id}`, payload);
    return response.data;
  },

  deleteQuestion: async (id: number): Promise<void> => {
    await apiClient.delete(`/questions/${id}`);
  },

  reorderQuestions: async (quizId: number, orders: QuestionReorderItem[]): Promise<Question[]> => {
    const response = await apiClient.patch<Question[]>(`/quizzes/${quizId}/questions/reorder`, { orders });
    return response.data;
  },
};
