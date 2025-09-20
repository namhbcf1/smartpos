import { useState, useCallback, createContext, useContext } from 'react'
import React from 'react'
import { ErrorSeverity, ErrorToast } from '../components/ui/ErrorDisplay'

export interface ErrorState {
  message: string
  severity: ErrorSeverity
  title?: string
  visible: boolean
  id: string
}

export interface UseErrorHandlingReturn {
  errors: ErrorState[]
  showError: (message: string, options?: {
    severity?: ErrorSeverity
    title?: string
    duration?: number
  }) => string
  clearError: (id: string) => void
  clearAllErrors: () => void
  hasErrors: boolean
  hasErrorsOfSeverity: (severity: ErrorSeverity) => boolean
}

interface ErrorProviderProps {
  children: React.ReactNode
}

let errorIdCounter = 0

export const useErrorHandling = (): UseErrorHandlingReturn => {
  const [errors, setErrors] = useState<ErrorState[]>([])

  const showError = useCallback((
    message: string, 
    options: {
      severity?: ErrorSeverity
      title?: string
      duration?: number
    } = {}
  ): string => {
    const id = `error-${++errorIdCounter}`
    const { severity = 'error', title, duration = 5000 } = options

    const newError: ErrorState = {
      id,
      message,
      severity,
      title,
      visible: true
    }

    setErrors(prev => [...prev, newError])

    // Auto-dismiss after duration (except for critical errors)
    if (duration > 0 && severity !== 'critical') {
      setTimeout(() => {
        setErrors(prev => prev.filter(error => error.id !== id))
      }, duration)
    }

    return id
  }, [])

  const clearError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors([])
  }, [])

  const hasErrors = errors.length > 0

  const hasErrorsOfSeverity = useCallback((severity: ErrorSeverity): boolean => {
    return errors.some(error => error.severity === severity)
  }, [errors])

  return {
    errors,
    showError,
    clearError,
    clearAllErrors,
    hasErrors,
    hasErrorsOfSeverity
  }
}

// Global error context for application-wide error handling
export const ErrorContext = createContext<UseErrorHandlingReturn | undefined>(undefined)

export const useGlobalError = (): UseErrorHandlingReturn => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useGlobalError must be used within an ErrorProvider')
  }
  return context
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const errorHandling = useErrorHandling()

  return (
    <ErrorContext.Provider value={errorHandling}>
      {children}
      
      {/* Render error toasts */}
      {errorHandling.errors.map((error) => (
        <ErrorToast
          key={error.id}
          isVisible={error.visible}
          message={error.message}
          title={error.title}
          severity={error.severity}
          onClose={() => errorHandling.clearError(error.id)}
          position="top-right"
        />
      ))}
    </ErrorContext.Provider>
  )
}

// Utility functions for common error scenarios
export const createErrorHandlers = (showError: UseErrorHandlingReturn['showError']) => ({
  // Network/API errors
  handleNetworkError: (error: any) => {
    if (error.response?.status === 401) {
      return showError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', {
        severity: 'warning',
        title: 'Cần xác thực'
      })
    }
    
    if (error.response?.status === 403) {
      return showError('Bạn không có quyền thực hiện hành động này.', {
        severity: 'warning',
        title: 'Không có quyền truy cập'
      })
    }
    
    if (error.response?.status >= 500) {
      return showError('Lỗi máy chủ. Vui lòng thử lại sau.', {
        severity: 'error',
        title: 'Lỗi hệ thống'
      })
    }

    if (!navigator.onLine) {
      return showError('Không có kết nối internet. Vui lòng kiểm tra kết nối.', {
        severity: 'warning',
        title: 'Mất kết nối'
      })
    }

    const message = error.response?.data?.message || error.message || 'Đã xảy ra lỗi không xác định'
    return showError(message, { severity: 'error' })
  },

  // Validation errors
  handleValidationError: (field: string, message: string) => {
    return showError(`${field}: ${message}`, {
      severity: 'warning',
      title: 'Lỗi xác thực'
    })
  },

  // Permission errors
  handlePermissionError: (action?: string) => {
    const message = action 
      ? `Bạn không có quyền ${action}.`
      : 'Bạn không có quyền thực hiện hành động này.'
    
    return showError(message, {
      severity: 'warning',
      title: 'Không có quyền'
    })
  },

  // Critical system errors
  handleCriticalError: (message: string) => {
    return showError(message, {
      severity: 'critical',
      title: 'Lỗi nghiêm trọng',
      duration: 0 // Don't auto-dismiss critical errors
    })
  },

  // Success messages (using info severity)
  showSuccess: (message: string, title?: string) => {
    return showError(message, {
      severity: 'info',
      title: title || 'Thành công'
    })
  }
})

export default useErrorHandling
