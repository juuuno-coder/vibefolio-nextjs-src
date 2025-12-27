// 에러 모니터링 유틸리티
// Sentry 또는 다른 서비스로 교체 가능

interface ErrorContext {
  userId?: string;
  url?: string;
  component?: string;
  action?: string;
  extra?: Record<string, any>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  userAgent: string;
}

// 에러 로그 저장소 (개발용)
const errorLogs: ErrorReport[] = [];

/**
 * 에러 캡처 및 보고
 */
export function captureError(error: Error, context: ErrorContext = {}) {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    context: {
      ...context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    },
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
  };

  // 콘솔에 출력 (개발 환경)
  if (process.env.NODE_ENV === "development") {
    console.error("[ErrorMonitor]", report);
  }

  // 로그 저장
  errorLogs.push(report);
  if (errorLogs.length > 100) {
    errorLogs.shift(); // 오래된 로그 제거
  }

  // TODO: Sentry 연동 시 여기에 추가
  // Sentry.captureException(error, { extra: context });

  // 서버에 보고 (프로덕션)
  if (process.env.NODE_ENV === "production") {
    sendErrorToServer(report);
  }
}

/**
 * 메시지 캡처 (경고 등)
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context: ErrorContext = {}
) {
  if (process.env.NODE_ENV === "development") {
    if (level === "error") {
      console.error("[ErrorMonitor]", message, context);
    } else if (level === "warning") {
      console.warn("[ErrorMonitor]", message, context);
    } else {
      console.log("[ErrorMonitor]", message, context);
    }
  }

  // TODO: Sentry 연동 시
  // Sentry.captureMessage(message, { level, extra: context });
}

/**
 * 사용자 컨텍스트 설정
 */
export function setUserContext(user: { id: string; email?: string; name?: string }) {
  // TODO: Sentry 연동 시
  // Sentry.setUser(user);
  
  if (process.env.NODE_ENV === "development") {
    console.log("[ErrorMonitor] User context set:", user);
  }
}

/**
 * 사용자 컨텍스트 제거
 */
export function clearUserContext() {
  // TODO: Sentry 연동 시
  // Sentry.setUser(null);
}

/**
 * 에러를 서버로 전송
 */
async function sendErrorToServer(report: ErrorReport) {
  try {
    // API 엔드포인트로 에러 보고
    await fetch("/api/error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
  } catch (e) {
    // 에러 보고 실패는 무시
    console.warn("[ErrorMonitor] Failed to send error report");
  }
}

/**
 * 최근 에러 로그 가져오기 (관리자용)
 */
export function getRecentErrors(): ErrorReport[] {
  return [...errorLogs].reverse();
}

/**
 * React Error Boundary 지원
 */
export function handleReactError(error: Error, errorInfo: React.ErrorInfo) {
  captureError(error, {
    component: "ErrorBoundary",
    extra: {
      componentStack: errorInfo.componentStack,
    },
  });
}

/**
 * API 에러 핸들러
 */
export function handleApiError(error: unknown, endpoint: string) {
  const actualError = error instanceof Error ? error : new Error(String(error));
  
  captureError(actualError, {
    action: "API_CALL",
    extra: { endpoint },
  });
}

/**
 * 전역 에러 핸들러 설정
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  // 처리되지 않은 에러
  window.onerror = (message, source, lineno, colno, error) => {
    if (error) {
      captureError(error, {
        extra: { source, lineno, colno },
      });
    }
    return false;
  };

  // Promise rejection
  window.onunhandledrejection = (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    
    captureError(error, {
      action: "UNHANDLED_PROMISE_REJECTION",
    });
  };
}
