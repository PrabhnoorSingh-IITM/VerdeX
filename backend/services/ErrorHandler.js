/**
 * VerdeX Global Error Mapping & Interceptor
 * Decouples raw Firebase exception signals into human-readable UI Toasts.
 */

export const ErrorHandler = {
  parse: (error) => {
    console.error("[VerdeX Core Error]:", error);

    // Network Errors
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      return "Network sync failed. System cached data securely and will retry automatically.";
    }

    // Auth & Permission Mismatches
    if (error.code === 'permission-denied') {
      return "Access denied: Your account role lacks authorization for this operation.";
    }
    if (error.code === 'auth/invalid-credential') {
      return "Incorrect credentials. Verify your login constraints.";
    }

    // Payload Defaults
    if (error.code === 'invalid-argument') {
      return "System rejected the payload formatting. Please refresh and retry.";
    }

    // Generic Fallback Structure
    return error.message || "An unexpected system anomaly occurred.";
  },

  handle: (error) => {
    const safeMessage = ErrorHandler.parse(error);
    if (typeof window.showToast === 'function') {
      window.showToast(safeMessage, 'error', 4000);
    } else {
      alert(safeMessage);
    }
    return safeMessage; // Optional bubble-up
  }
};
