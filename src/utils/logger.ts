/**
 * Environment-aware logger utility.
 *
 * - In development (`import.meta.env.DEV`): logs at DEBUG level and above.
 * - In production: all log methods are no-ops.
 * - Vite's esbuild config additionally strips any residual `console.*` from
 *   production bundles as a safety net (see vite.config.ts).
 *
 * NEVER pass user PII (emails, tokens, passwords, names) to any log level.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'error'

function shouldLog(level: LogLevel): boolean {
  return import.meta.env.DEV && LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFn = (...args: any[]) => void

const noop: LogFn = () => {}

const logger = {
  debug: shouldLog('debug')
    ? (...args: unknown[]) => console.debug('[DEBUG]', ...args)
    : noop,
  info: shouldLog('info')
    ? (...args: unknown[]) => console.info('[INFO]', ...args)
    : noop,
  warn: shouldLog('warn')
    ? (...args: unknown[]) => console.warn('[WARN]', ...args)
    : noop,
  error: shouldLog('error')
    ? (...args: unknown[]) => console.error('[ERROR]', ...args)
    : noop,
} as const

export default logger
