export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdatePayload {
  full_name?: string;
  email?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreatePayload {
  name: string;
  description?: string;
}

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionOption {
  id: number;
  option_text: string;
  is_correct?: boolean;
}

export interface Question {
  id: number;
  quiz_id: number;
  text: string;
  image_url?: string;
  explanation?: string;
  order: number;
  options: QuestionOption[];
  created_at?: string;
  updated_at?: string;
}

export interface QuestionCreatePayload {
  text: string;
  image_url?: string;
  explanation?: string;
  order?: number;
  options: {
    option_text: string;
    is_correct: boolean;
  }[];
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  category_id?: number;
  creator_id: number;
  difficulty: QuizDifficulty;
  time_limit_minutes: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  question_count: number;
  questions?: Question[];
}

export interface QuizCreatePayload {
  title: string;
  description?: string;
  category_id?: number;
  difficulty: QuizDifficulty;
  time_limit_minutes: number;
}

export interface QuizPaginatedResponse {
  items: Quiz[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StudentQuestionOption {
  id: number;
  option_text: string;
}

export interface StudentQuestion {
  id: number;
  text: string;
  image_url?: string;
  order: number;
  options: StudentQuestionOption[];
}

export interface AttemptStartResponse {
  id: number;
  quiz_id: number;
  quiz_title: string;
  quiz_description?: string;
  time_limit_minutes: number;
  started_at: string;
  is_completed: boolean;
  questions: StudentQuestion[];
  current_answers: Record<number, number | null>;
}

export interface SaveAnswerItem {
  question_id: number;
  selected_option_id: number | null;
}

export interface AttemptAnswerDetail {
  question_id: number;
  question_text: string;
  image_url?: string;
  explanation?: string;
  selected_option_id: number | null;
  correct_option_id: number;
  is_correct: boolean;
  options: QuestionOption[];
}

export interface AttemptResultResponse {
  id: number;
  quiz_id: number;
  quiz_title: string;
  user_id: number;
  user_name?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  percentage: number;
  time_taken_seconds: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
  answer_details?: AttemptAnswerDetail[];
}

export interface AttemptSummaryResponse {
  id: number;
  quiz_id: number;
  quiz_title: string;
  user_id: number;
  user_name?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  percentage: number;
  time_taken_seconds: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  attempt_id: number;
  user_id: number;
  user_name: string;
  score: number;
  percentage: number;
  time_taken_seconds: number;
  completed_at: string;
}

export interface QuizLeaderboardResponse {
  quiz_id: number;
  quiz_title: string;
  entries: LeaderboardEntry[];
  total_entries: number;
}

export interface OptionAnalytics {
  option_id: number;
  option_text: string;
  is_correct: boolean;
  selection_count: number;
  selection_percentage: number;
}

export interface QuestionAnalytics {
  question_id: number;
  question_text: string;
  order: number;
  total_answers: number;
  correct_answers: number;
  accuracy_percentage: number;
  options: OptionAnalytics[];
}

export interface QuizAnalyticsResponse {
  quiz_id: number;
  quiz_title: string;
  total_attempts: number;
  completed_attempts: number;
  completion_rate: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  average_time_taken_seconds: number;
  question_analytics: QuestionAnalytics[];
}
