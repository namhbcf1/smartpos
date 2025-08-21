// Vietnamese Computer Hardware POS Error Boundary
// ComputerPOS Pro - Production DaisyUI Implementation

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FiRefreshCw, FiHome, FiAlertTriangle } from 'react-icons/fi';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="text-center">
              <FiAlertTriangle className="mx-auto text-6xl text-error mb-4" />
              <h1 className="text-2xl font-bold text-error mb-2">
                Đã xảy ra lỗi
              </h1>
              <p className="text-base-content/70 mb-6">
                Xin lỗi, đã có lỗi xảy ra trong hệ thống ComputerPOS Pro. 
                Vui lòng thử lại hoặc liên hệ hỗ trợ kỹ thuật.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-base-200 rounded p-4 mb-6 text-left">
                  <h3 className="font-semibold text-sm mb-2">Chi tiết lỗi:</h3>
                  <pre className="text-xs text-base-content/70 overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-3 justify-center">
                <button 
                  className="btn btn-primary"
                  onClick={this.handleRefresh}
                >
                  <FiRefreshCw className="mr-2" />
                  Tải lại trang
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={this.handleGoHome}
                >
                  <FiHome className="mr-2" />
                  Về trang chủ
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
