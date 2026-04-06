import { logger } from "@/utils/logger";

/**
 * Centralized Logging Utility for Pharmazine
 *
 * Provides environment-aware logging that can be easily toggled
 * Prevents console pollution in production
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
  environment: "development" | "production" | "test";
}

class Logger {
  private config: LogConfig;

  constructor() {
    // Read from environment variables
    const isDevelopment =
      import.meta.env.DEV || import.meta.env.MODE === "development";
    const isDebugEnabled = import.meta.env.VITE_DEBUG === "true";

    this.config = {
      enableDebug: isDevelopment || isDebugEnabled,
      enableInfo: isDevelopment || isDebugEnabled,
      enableWarn: true, // Always show warnings
      enableError: true, // Always show errors
      environment: isDevelopment ? "development" : "production",
    };
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return data ? `${prefix} ${message}` : `${prefix} ${message}`;
  }

  /**
   * Debug level logging - only in development
   */
  debug(message: string, data?: any) {
    if (!this.config.enableDebug) return;

    const formatted = this.formatMessage("debug", message, data);
    if (data) {
      logger.debug(formatted, data);
    } else {
      logger.debug(formatted);
    }
  }

  /**
   * Info level logging - normal operations
   */
  info(message: string, data?: any) {
    if (!this.config.enableInfo) return;

    const formatted = this.formatMessage("info", message, data);
    if (data) {
      logger.info(formatted, data);
    } else {
      logger.info(formatted);
    }
  }

  /**
   * Warning level logging - something unexpected but handled
   */
  warn(message: string, data?: any) {
    if (!this.config.enableWarn) return;

    const formatted = this.formatMessage("warn", message, data);
    if (data) {
      logger.warn(formatted, data);
    } else {
      logger.warn(formatted);
    }
  }

  /**
   * Error level logging - critical issues
   */
  error(message: string, error?: Error | any) {
    if (!this.config.enableError) return;

    const formatted = this.formatMessage("error", message, error);

    if (error instanceof Error) {
      logger.error(formatted, {
        message: error.message,
        stack: error.stack,
        ...error,
      });
    } else if (error) {
      logger.error(formatted, error);
    } else {
      logger.error(formatted);
    }
  }

  /**
   * API call logging - track API requests/responses
   */
  api(method: string, url: string, status?: number, data?: any) {
    if (!this.config.enableDebug) return;

    const message = status
      ? `API ${method} ${url} - ${status}`
      : `API ${method} ${url}`;

    this.debug(message, data);
  }

  /**
   * Group related logs
   */
  group(label: string, callback: () => void) {
    if (!this.config.enableDebug) {
      callback();
      return;
    }

    console.group(label);
    callback();
    console.groupEnd();
  }

  /**
   * Performance timing
   */
  time(label: string) {
    if (!this.config.enableDebug) return;
    console.time(label);
  }

  timeEnd(label: string) {
    if (!this.config.enableDebug) return;
    console.timeEnd(label);
  }
}

// Export singleton instance
export const logger = new Logger();

// Also export as default
export default logger;
