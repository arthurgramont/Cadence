#!/usr/bin/env node
/**
 * export-logs.mjs — Skill Transverse : Export des logs système
 *
 * Lit storage/logs.json et le formate en CSV ou Markdown selon l'argument passé.
 *
 * Usage :
 *   node scripts/export-logs.mjs          → CSV  (défaut)
 *   node scripts/export-logs.mjs --md     → Markdown
 *   node scripts/export-logs.mjs --csv    → CSV explicite
 *
 * Sortie sur stdout — peut être redirigée vers un fichier :
 *   node scripts/export-logs.mjs --md > logs_export.md
 *   node scripts/export-logs.mjs --csv > logs_export.csv
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOG_FILE = path.join(__dirname, '..', 'storage', 'logs.json')

function readLogs() {
  if (!fs.existsSync(LOG_FILE)) {
    console.error(`[export-logs] Fichier introuvable : ${LOG_FILE}`)
    process.exit(1)
  }
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'))
  } catch (err) {
    console.error(`[export-logs] JSON invalide : ${err.message}`)
    process.exit(1)
  }
}

function escapeCsv(value) {
  const str = value === undefined || value === null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(logs) {
  const header = 'id,timestamp,level,message,context'
  const rows = logs.map((e) =>
    [
      escapeCsv(e.id),
      escapeCsv(e.timestamp),
      escapeCsv(e.level),
      escapeCsv(e.message),
      escapeCsv(e.context ? JSON.stringify(e.context) : ''),
    ].join(',')
  )
  return [header, ...rows].join('\n')
}

function toMarkdown(logs) {
  const lines = [
    '# Export des logs système — Cadence',
    '',
    `_${logs.length} entrée(s) — exporté le ${new Date().toISOString()}_`,
    '',
    '| Horodatage | Niveau | Message | Contexte |',
    '|---|---|---|---|',
  ]
  for (const e of logs) {
    const ctx = e.context ? JSON.stringify(e.context) : '—'
    lines.push(`| ${e.timestamp} | **${e.level}** | ${e.message} | \`${ctx}\` |`)
  }
  return lines.join('\n')
}

const args = process.argv.slice(2)
const format = args.includes('--md') ? 'md' : 'csv'
const logs = readLogs()

console.log(format === 'md' ? toMarkdown(logs) : toCsv(logs))
