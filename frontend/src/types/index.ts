export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student';
  created_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
