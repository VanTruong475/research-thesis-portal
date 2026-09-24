export interface ApiResponse<T> {
  message: string;
  data: T;
  meta?: any;
}

export interface ApiError {
  detail: string;
  error_code?: string;
}
