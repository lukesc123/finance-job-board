/**
 * Server-side logger that gates output behind NODE_ENV.
 * In production, only warnings and errors are logged.
 * In development, all levels are logged.
 *
 * This avoids leaking debug info to production logs while
 * keeping useful error context during development.
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  /** Debug info — only in development */
  debug(...args: unknown[]) {
    if (isDev) console.log('[debug]', ...args)
  },

  /** General info — only in development */
  info(...args: unknown[]) {
    if (isDev) console.info('[info]', ...args)
  },

  /** Warnings — always logged */
  warn(...args: unknown[]) {
    console.warn('[warn]', ...args)
  },

  /** Errors — always logged */
  error(...args: unknown[]) {
    console.error('[error]', ...args)
  },
}
