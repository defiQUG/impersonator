/**
 * Monitoring and error tracking utilities
 * Provides centralized logging and error reporting
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  error?: Error;
}

class MonitoringService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private errorTrackingEnabled = false;
  private errorTrackingService?: any; // Sentry or similar

  /**
   * Initialize error tracking service
   * @param service - Error tracking service (e.g., Sentry)
   */
  initErrorTracking(service: any): void {
    this.errorTrackingService = service;
    this.errorTrackingEnabled = true;
  }

  /**
   * Log a message
   */
  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      error,
    };

    // Add to local logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest
    }

    // Console logging
    const logMethod = console[level] || console.log;
    if (error) {
      logMethod(`[${level.toUpperCase()}] ${message}`, context, error);
    } else {
      logMethod(`[${level.toUpperCase()}] ${message}`, context);
    }

    // Send to error tracking service
    if (this.errorTrackingEnabled && level === LogLevel.ERROR && this.errorTrackingService) {
      try {
        if (error) {
          this.errorTrackingService.captureException(error, { extra: context });
        } else {
          this.errorTrackingService.captureMessage(message, { level, extra: context });
        }
      } catch (e) {
        console.error("Failed to send error to tracking service:", e);
      }
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    return filtered;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Track security event
   */
  trackSecurityEvent(event: string, details: Record<string, any>): void {
    this.warn(`Security Event: ${event}`, details);
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === "production") {
      // Example: sendToSecurityMonitoring(event, details);
    }
  }

  /**
   * Track rate limit hit
   */
  trackRateLimit(key: string): void {
    this.warn("Rate limit exceeded", { key, timestamp: Date.now() });
  }

  /**
   * Track validation failure
   */
  trackValidationFailure(field: string, value: any, reason: string): void {
    this.warn("Validation failed", { field, value, reason });
  }

  /**
   * Track encryption failure
   */
  trackEncryptionFailure(operation: string, error: Error): void {
    this.error(`Encryption failure: ${operation}`, error);
  }

  /**
   * Track transaction event
   */
  trackTransaction(event: string, txId: string, details?: Record<string, any>): void {
    this.info(`Transaction ${event}`, { txId, ...details });
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Initialize in production
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  // Example: Initialize Sentry
  // import * as Sentry from "@sentry/nextjs";
  // monitoring.initErrorTracking(Sentry);
}
