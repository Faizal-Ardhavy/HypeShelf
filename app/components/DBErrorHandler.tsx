"use client";

import { ReactNode } from "react";

interface DBErrorFallbackProps {
  error: Error;
  retry: () => void;
}

/**
 * Database Error Fallback Component
 * 
 * Displayed when database queries fail due to:
 * - Connection timeout
 * - Network issues
 * - Database unavailability
 * - Query errors
 */
export function DBErrorFallback({ error, retry }: DBErrorFallbackProps) {
  const isTimeout = error.message.includes("timeout") || error.message.includes("timed out");
  const isConnection = error.message.includes("connection") || error.message.includes("network");

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-900 mb-1">
            {isTimeout
              ? "Connection Timeout"
              : isConnection
              ? "Connection Problem"
              : "Database Error"}
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            {isTimeout
              ? "The database is taking too long to respond. This might be due to network issues or high server load."
              : isConnection
              ? "Unable to connect to the database. Please check your internet connection."
              : "We're having trouble loading the data. This is usually temporary."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={retry}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DBLoadingProps {
  message?: string;
}

/**
 * Database Loading Component
 * 
 * Displayed while waiting for database queries
 */
export function DBLoading({ message = "Loading data..." }: DBLoadingProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="ml-4 text-gray-600">{message}</p>
    </div>
  );
}

interface DBEmptyProps {
  message?: string;
  icon?: ReactNode;
}

/**
 * Database Empty State Component
 * 
 * Displayed when query returns no results
 */
export function DBEmpty({ 
  message = "No data found",
  icon 
}: DBEmptyProps) {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
}

/**
 * Helper function to handle database query errors
 * Adds timeout detection and user-friendly error messages
 */
export function handleDBError(error: unknown): Error {
  if (error instanceof Error) {
    // Enhance error message for timeout scenarios
    if (error.message.includes("AbortError") || error.message.includes("timeout")) {
      return new Error("Database connection timeout. Please try again.");
    }
    
    // Enhance error message for connection issues
    if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
      return new Error("Unable to connect to database. Please check your internet connection.");
    }
    
    return error;
  }
  
  return new Error("An unexpected database error occurred");
}

/**
 * Retry logic utility
 * Helps implement retry functionality for failed database operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = handleDBError(error);
      
      if (i < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError || new Error("Operation failed after retries");
}
