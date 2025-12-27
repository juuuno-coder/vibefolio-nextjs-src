"use client";

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { handleReactError } from "@/lib/utils/errorMonitor";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // 에러 모니터링 시스템에 보고
    handleReactError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              문제가 발생했습니다
            </h2>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              예기치 않은 오류가 발생했습니다. 
              문제가 지속되면 관리자에게 문의해주세요.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
              <Button asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  홈으로
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 간단한 에러 UI 컴포넌트
interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
}

export function ErrorDisplay({
  title = "오류가 발생했습니다",
  message = "잠시 후 다시 시도해주세요.",
  onRetry,
  showHome = true,
}: ErrorDisplayProps) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {message}
        </p>

        <div className="flex gap-2 justify-center">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-1" />
              다시 시도
            </Button>
          )}
          {showHome && (
            <Button size="sm" asChild>
              <Link href="/">홈으로</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 로딩 스피너
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-green-500 rounded-full animate-spin`}
      />
    </div>
  );
}
