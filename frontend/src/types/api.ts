/** 后端统一响应包络 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
