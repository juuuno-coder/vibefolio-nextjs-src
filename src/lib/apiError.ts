export function handleApiError(error: any, message: string, status = 500) {
  console.error(message, error);
  return {
    error: error?.message || message,
    status,
  };
}
