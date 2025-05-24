/**
 * Structured Logging and Metrics Collection for Python Dependency Resolver
 * Provides comprehensive logging, error tracking, and performance monitoring
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogContext = Record<string, any>;

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  trace_id?: string;
  request_id?: string;
  agent_id?: string;
  duration_ms?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface MetricEntry {
  timestamp: string;
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  trace_id?: string;
}

export class Logger {
  private level: LogLevel;
  private context: LogContext;
  private traceId?: string;
  private requestId?: string;
  private agentId?: string;

  constructor(
    level: LogLevel = "info",
    baseContext: LogContext = {},
    traceId?: string,
    requestId?: string,
    agentId?: string
  ) {
    this.level = level;
    this.context = baseContext;
    this.traceId = traceId;
    this.requestId = requestId;
    this.agentId = agentId;
  }

  private getLogLevelValue(level: LogLevel): number {
    const levels = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
    return levels[level];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.getLogLevelValue(level) >= this.getLogLevelValue(this.level);
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration_ms?: number
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      trace_id: this.traceId,
      request_id: this.requestId,
      agent_id: this.agentId,
    };

    if (duration_ms !== undefined) {
      entry.duration_ms = duration_ms;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    // Use appropriate console method based on level
    switch (entry.level) {
      case "debug":
        console.debug(logString);
        break;
      case "info":
        console.info(logString);
        break;
      case "warn":
        console.warn(logString);
        break;
      case "error":
      case "fatal":
        console.error(logString);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog("debug")) {
      this.writeLog(this.createLogEntry("debug", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog("info")) {
      this.writeLog(this.createLogEntry("info", message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog("warn")) {
      this.writeLog(this.createLogEntry("warn", message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog("error")) {
      this.writeLog(this.createLogEntry("error", message, context, error));
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog("fatal")) {
      this.writeLog(this.createLogEntry("fatal", message, context, error));
    }
  }

  // Performance logging with duration
  timed(message: string, duration_ms: number, context?: LogContext): void {
    if (this.shouldLog("info")) {
      this.writeLog(
        this.createLogEntry("info", message, context, undefined, duration_ms)
      );
    }
  }

  // Create a child logger with additional context
  child(additionalContext: LogContext, agentId?: string): Logger {
    return new Logger(
      this.level,
      { ...this.context, ...additionalContext },
      this.traceId,
      this.requestId,
      agentId || this.agentId
    );
  }

  // Update trace and request IDs
  withTracing(traceId: string, requestId?: string): Logger {
    return new Logger(
      this.level,
      this.context,
      traceId,
      requestId || this.requestId,
      this.agentId
    );
  }
}

export class MetricsCollector {
  private traceId?: string;

  constructor(traceId?: string) {
    this.traceId = traceId;
  }

  private writeMetric(entry: MetricEntry): void {
    // In production, you might send this to a metrics service
    // For now, we'll log it as a structured metric
    console.info(JSON.stringify({ type: "metric", ...entry }));
  }

  counter(
    name: string,
    value: number = 1,
    tags?: Record<string, string>
  ): void {
    this.writeMetric({
      timestamp: new Date().toISOString(),
      name,
      value,
      unit: "count",
      tags,
      trace_id: this.traceId,
    });
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.writeMetric({
      timestamp: new Date().toISOString(),
      name,
      value,
      unit: "gauge",
      tags,
      trace_id: this.traceId,
    });
  }

  histogram(
    name: string,
    value: number,
    unit: string = "ms",
    tags?: Record<string, string>
  ): void {
    this.writeMetric({
      timestamp: new Date().toISOString(),
      name,
      value,
      unit,
      tags,
      trace_id: this.traceId,
    });
  }

  timing(
    name: string,
    duration_ms: number,
    tags?: Record<string, string>
  ): void {
    this.histogram(name, duration_ms, "ms", tags);
  }
}

// Utility function to create logger from environment
export function createLogger(env: any, agentId?: string): Logger {
  const logLevel = (env.LOG_LEVEL as LogLevel) || "info";
  const environment = env.ENVIRONMENT || "development";

  const baseContext = {
    environment,
    worker: "python-dependency-resolver",
  };

  return new Logger(logLevel, baseContext, undefined, undefined, agentId);
}

// Utility function to create metrics collector
export function createMetrics(traceId?: string): MetricsCollector {
  return new MetricsCollector(traceId);
}

// Performance monitoring utilities
export interface TimingResult<T> {
  result: T;
  duration_ms: number;
}

export async function timeAsync<T>(
  fn: () => Promise<T>,
  logger: Logger,
  operationName: string,
  context?: LogContext
): Promise<TimingResult<T>> {
  const start = Date.now();
  logger.debug(`Starting ${operationName}`, context);

  try {
    const result = await fn();
    const duration_ms = Date.now() - start;

    logger.timed(`Completed ${operationName}`, duration_ms, context);

    return { result, duration_ms };
  } catch (error) {
    const duration_ms = Date.now() - start;
    logger.error(`Failed ${operationName}`, error as Error, {
      ...context,
      duration_ms,
    });
    throw error;
  }
}

export function timeSync<T>(
  fn: () => T,
  logger: Logger,
  operationName: string,
  context?: LogContext
): TimingResult<T> {
  const start = Date.now();
  logger.debug(`Starting ${operationName}`, context);

  try {
    const result = fn();
    const duration_ms = Date.now() - start;

    logger.timed(`Completed ${operationName}`, duration_ms, context);

    return { result, duration_ms };
  } catch (error) {
    const duration_ms = Date.now() - start;
    logger.error(`Failed ${operationName}`, error as Error, {
      ...context,
      duration_ms,
    });
    throw error;
  }
}

// Error context utilities
export function enrichErrorContext(error: Error, context: LogContext): Error {
  // Add context to error for better debugging
  const enrichedError = new Error(error.message);
  enrichedError.name = error.name;
  enrichedError.stack = error.stack;

  // Add context as a property (will be serialized in logs)
  (enrichedError as any).context = context;

  return enrichedError;
}

// Trace ID generation
export function generateTraceId(): string {
  return crypto.randomUUID();
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}

// Rate limiting for logs to prevent spam
class LogRateLimiter {
  private counts = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxLogs = 100; // Max logs per minute per key

  shouldLog(key: string): boolean {
    const now = Date.now();
    const entry = this.counts.get(key);

    if (!entry || now > entry.resetTime) {
      this.counts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxLogs) {
      return false;
    }

    entry.count++;
    return true;
  }
}

const globalRateLimiter = new LogRateLimiter();

export function createRateLimitedLogger(baseLogger: Logger): Logger {
  // Create a proxy that rate limits logs
  return new Proxy(baseLogger, {
    get(target, prop) {
      if (
        typeof prop === "string" &&
        ["debug", "info", "warn", "error", "fatal"].includes(prop)
      ) {
        return function (message: string, ...args: any[]) {
          const key = `${prop}:${message}`;
          if (globalRateLimiter.shouldLog(key)) {
            return (target as any)[prop](message, ...args);
          }
          // If rate limited, log a warning (which itself might be rate limited)
          if (
            prop !== "debug" &&
            globalRateLimiter.shouldLog(`rate-limit-warning:${prop}`)
          ) {
            target.warn(`Log rate limit exceeded for ${prop} level`);
          }
        };
      }
      return (target as any)[prop];
    },
  });
}
