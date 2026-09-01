import apiClient from './api';
import type {
  AttemptStartResponse, SaveAnswerItem, AttemptResultResponse, AttemptSummaryResponse
} from '../types';

export const attemptService = {
  startAttempt: async (quizId: number): Promise<AttemptStartResponse> => {
    const response = await apiClient.post<AttemptStartResponse>(`/quizzes/${quizId}/attempts`);
    return response.data;
  },

  saveAnswers: async (attemptId: number, answers: SaveAnswerItem[]): Promise<{ status: string; message: string }> => {
    const response = await apiClient.put<{ status: string; message: string }>(`/attempts/${attemptId}/answers`, { answers });
    return response.data;
  },

  submitAttempt: async (attemptId: number, answers?: SaveAnswerItem[]): Promise<AttemptResultResponse> => {
    const payload = answers ? { answers } : undefined;
    const response = await apiClient.post<AttemptResultResponse>(`/attempts/${attemptId}/submit`, payload);
    return response.data;
  },

  getMyAttempts: async (): Promise<AttemptSummaryResponse[]> => {
    const response = await apiClient.get<AttemptSummaryResponse[]>('/attempts/me');
    return response.data;
  },

  getAttemptResult: async (attemptId: number): Promise<AttemptResultResponse> => {
    const response = await apiClient.get<AttemptResultResponse>(`/attempts/${attemptId}/result`);
    return response.data;
  },

  getQuizAttempts: async (quizId: number): Promise<AttemptSummaryResponse[]> => {
    const response = await apiClient.get<AttemptSummaryResponse[]>(`/quizzes/${quizId}/attempts`);
    return response.data;
  },
};
