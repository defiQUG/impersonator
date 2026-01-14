/**
 * Sentry client-side configuration
 * This file configures Sentry for client-side error tracking
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN && typeof window !== "undefined") {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // Set sample rate for profiling
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === "development") {
        return null;
      }
      
      // Filter out sensitive information
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
        }
        
        // Remove sensitive query params
        if (event.request.query_string) {
          const params = new URLSearchParams(event.request.query_string);
          params.delete("apiKey");
          params.delete("token");
          event.request.query_string = params.toString();
        }
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "originalCreateNotification",
      "canvas.contentDocument",
      "MyApp_RemoveAllHighlights",
      "atomicFindClose",
      // Network errors
      "NetworkError",
      "Failed to fetch",
      "Network request failed",
      // User cancellations
      "User cancelled",
    ],
    
    // Additional options
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate
        tracePropagationTargets: ["localhost", /^https:\/\/.*\.impersonator\.xyz/],
      }),
      new Sentry.Replay({
        // Mask sensitive data
        maskAllText: false,
        maskAllInputs: true,
      }),
    ],
  });
}
