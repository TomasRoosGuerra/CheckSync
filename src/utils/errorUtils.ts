/**
 * Consistent error handling utility for services
 */

export const handleServiceError = (
  error: unknown,
  operation: string,
  context?: string
): never => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const logMessage = context
    ? `❌ Error ${operation} (${context}): ${errorMessage}`
    : `❌ Error ${operation}: ${errorMessage}`;

  console.error(logMessage);
  throw error;
};

export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    handleServiceError(error, operationName, context);
    throw error; // Re-throw the error after handling
  }
};
