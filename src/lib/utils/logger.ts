import fs from 'node:fs'
import path from 'node:path'

export type LogLevel = 'INFO' | 'ERROR' | 'ACTION'

export type LogEntry = {
  id: string
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, string>
}

const LOG_FILE = path.join(process.cwd(), 'storage', 'logs.json')

function ensureDir(): void {
  const dir = path.dirname(LOG_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function readLogs(): LogEntry[] {
  if (!fs.existsSync(LOG_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')) as LogEntry[]
  } catch {
    return []
  }
}

function appendLog(level: LogLevel, message: string, context?: Record<string, string>): void {
  try {
    ensureDir()
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }
    const trimmed = [...readLogs(), entry].slice(-500)
    fs.writeFileSync(LOG_FILE, JSON.stringify(trimmed, null, 2), 'utf-8')
  } catch {
    // Filesystem unavailable in this environment — log entry silently dropped
  }
}

export function logAction(message: string, context?: Record<string, string>): void {
  appendLog('ACTION', message, context)
}

export function logInfo(message: string, context?: Record<string, string>): void {
  appendLog('INFO', message, context)
}

export function logError(message: string, context?: Record<string, string>): void {
  console.error(`[ERROR] ${message}`, context ?? '')
  appendLog('ERROR', message, context)
}
