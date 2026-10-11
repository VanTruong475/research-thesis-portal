export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ValidationFieldError {
  field: string;
  message: string;
}

export interface ValidationErrorDetails {
  fields: ValidationFieldError[];
}

export interface ApiError<TDetails = Record<string, unknown> | ValidationErrorDetails | null> {
  code: string;
  details: TDetails;
}

export interface ApiErrorResponse<TDetails = Record<string, unknown> | ValidationErrorDetails | null> {
  success: false;
  message: string;
  error: ApiError<TDetails>;
}
