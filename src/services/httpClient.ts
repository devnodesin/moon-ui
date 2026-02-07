import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { HttpClientConfig, AppError } from '../types/http';

export class HttpClient {
  private client: AxiosInstance;
  private tokenStorage: HttpClientConfig['tokenStorage'];
  private onSessionExpired?: () => void;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: HttpClientConfig) {
    this.tokenStorage = config.tokenStorage;
    this.onSessionExpired = config.onSessionExpired;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - attach Authorization header
    this.client.interceptors.request.use(
      (config) => {
        const token = this.tokenStorage.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 and errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // If already refreshing, wait for it
            if (this.isRefreshing) {
              await this.refreshPromise;
              return this.client(originalRequest);
            }

            // Start refresh process
            this.isRefreshing = true;
            this.refreshPromise = this.refreshAccessToken();
            await this.refreshPromise;

            // Retry original request with new token
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, trigger session expired
            if (this.onSessionExpired) {
              this.onSessionExpired();
            }
            throw this.normalizeError(refreshError);
          } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        }

        // Normalize and throw error
        throw this.normalizeError(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(
      `${this.client.defaults.baseURL}/auth:refresh`,
      { refresh_token: refreshToken }
    );

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
    const expiresAt = Date.now() + expiresIn * 1000;

    this.tokenStorage.setTokens(accessToken, newRefreshToken, expiresAt);
  }

  private normalizeError(error: unknown): AppError {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      return {
        code: data?.code || `HTTP_${error.response?.status || 'ERROR'}`,
        message: data?.message || error.message || 'An error occurred',
        details: data,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error,
    };
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on 4xx errors (except 401 which is handled separately)
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500 && status !== 401) {
            throw error;
          }
        }

        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          break;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.retryWithBackoff(() => this.client.get<T>(url, config));
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.retryWithBackoff(() => this.client.post<T>(url, data, config));
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.retryWithBackoff(() => this.client.put<T>(url, data, config));
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.retryWithBackoff(() => this.client.patch<T>(url, data, config));
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.retryWithBackoff(() => this.client.delete<T>(url, config));
  }

  updateBaseUrl(baseUrl: string) {
    this.client.defaults.baseURL = baseUrl;
  }

  clearTokens() {
    this.tokenStorage.clearTokens();
  }
}
