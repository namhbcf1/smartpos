import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { 
  handleApiError, 
  extractErrorMessage, 
  ApiError, 
  ErrorHandlerOptions,
  isNetworkError,
  isAuthError,
  isServerError
} from '../utils/errorHandler';

export interface UseErrorHandlerReturn {
  error: ApiError | null;
  isLoading: boolean;
  clearError: () => void;
  handleError: (error: any, options?: ErrorHandlerOptions) => ApiError;
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    options?: ErrorHandlerOptions
  ) => Promise<T | null>;
  retryOperation: () => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastOperation, setLastOperation] = useState<(() => Promise<any>) | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any, options: ErrorHandlerOptions = {}): ApiError => {
    const { showNotification = true } = options;
    
    const apiError = handleApiError(error, options);
    setError(apiError);

    // Show notification based on error type
    if (showNotification) {
      if (isAuthError(error)) {
        enqueueSnackbar('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', { 
          variant: 'warning',
          autoHideDuration: 5000
        });
      } else if (isNetworkError(error)) {
        enqueueSnackbar('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.', { 
          variant: 'error',
          autoHideDuration: 5000
        });
      } else if (isServerError(error)) {
        enqueueSnackbar('Lỗi máy chủ. Hệ thống sẽ thử lại tự động.', { 
          variant: 'error',
          autoHideDuration: 5000
        });
      } else {
        enqueueSnackbar(apiError.message, { 
          variant: 'error',
          autoHideDuration: 5000
        });
      }
    }

    return apiError;
  }, [enqueueSnackbar]);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    setLastOperation(() => operation);

    try {
      const result = await operation();
      setError(null);
      return result;
    } catch (error) {
      handleError(error, options);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const retryOperation = useCallback(async () => {
    if (lastOperation) {
      await executeWithErrorHandling(lastOperation, { showNotification: false });
    }
  }, [lastOperation, executeWithErrorHandling]);

  return {
    error,
    isLoading,
    clearError,
    handleError,
    executeWithErrorHandling,
    retryOperation
  };
}

/**
 * Hook for handling form errors specifically
 */
export function useFormErrorHandler() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { handleError } = useErrorHandler();

  const handleFormError = useCallback((error: any) => {
    const apiError = handleError(error, { showNotification: false });
    
    // Extract field-specific errors
    if (apiError.details?.errors && Array.isArray(apiError.details.errors)) {
      const errors: Record<string, string> = {};
      apiError.details.errors.forEach((err: any) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      setFieldErrors(errors);
    } else {
      // Show general error notification
      handleError(error);
    }

    return apiError;
  }, [handleError]);

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    fieldErrors,
    handleFormError,
    clearFieldErrors,
    clearFieldError
  };
}

/**
 * Hook for handling async operations with loading states
 */
export function useAsyncOperation<T>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const apiError = handleApiError(err, options);
      setError(apiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset
  };
}

/**
 * Hook for handling paginated data with error handling
 */
export function usePaginatedData<T>() {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { executeWithErrorHandling, error, isLoading } = useErrorHandler();

  const loadData = useCallback(async (
    fetcher: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
    newPage?: number,
    newLimit?: number
  ) => {
    const currentPage = newPage ?? page;
    const currentLimit = newLimit ?? limit;

    const result = await executeWithErrorHandling(
      () => fetcher(currentPage, currentLimit),
      { fallbackMessage: 'Không thể tải dữ liệu' }
    );

    if (result) {
      setData(result.data);
      setTotal(result.total);
      setPage(currentPage);
      setLimit(currentLimit);
    }
  }, [page, limit, executeWithErrorHandling]);

  const nextPage = useCallback(() => {
    const totalPages = Math.ceil(total / limit);
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, total, limit]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    const totalPages = Math.ceil(total / limit);
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [total, limit]);

  return {
    data,
    total,
    page,
    limit,
    isLoading,
    error,
    loadData,
    nextPage,
    prevPage,
    goToPage,
    setLimit
  };
}
