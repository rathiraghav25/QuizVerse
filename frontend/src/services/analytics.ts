import apiClient from './api';
import type { QuizLeaderboardResponse, QuizAnalyticsResponse } from '../types';

export const analyticsService = {
  getLeaderboard: async (quizId: number, limit: number = 100): Promise<QuizLeaderboardResponse> => {
    const response = await apiClient.get<QuizLeaderboardResponse>(`/quizzes/${quizId}/leaderboard`, {
      params: { limit },
    });
    return response.data;
  },

  getAnalytics: async (quizId: number): Promise<QuizAnalyticsResponse> => {
    const response = await apiClient.get<QuizAnalyticsResponse>(`/quizzes/${quizId}/analytics`);
    return response.data;
  },
};
