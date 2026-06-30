/**
 * Auditeur de dette technique — skill déterministe Cadence
 * Usage : npx tsx scripts/audit-dette.ts [--src <path>]
 * Exemple : npx tsx scripts/audit-dette.ts
 *
 * Retourne exit 0 si score = 100%, exit 1 sinon (intégrable en CI).
 */

import fs from 'node:fs'
import path from 'node:path'

// ─── Constantes métier (synchro avec CLAUDE.md) ───────────────────────────────

const MAX_FILE_LINES = 250
const PENALTY_GOD_FILE = 10  // > 250 lignes
const PENALTY_ANY = 3        // type générique explicite
const PENALTY_TODO = 2        // marqueur TODO/FIXME
const PENALTY_STUB = 5        // fonction vide / stub

// ─── Patterns de détection ────────────────────────────────────────────────────

// Détecte colon-any, as-any, generic-any et array-any (hors mots comme "company")
const RE_ANY = new RegExp(
  '(?::\\s*any\\b|\\bas\\s+any\\b|[(<,]\\s*any\\s*[>),]|any\\[\\])',
)

/** TODO / FIXME, insensible à la casse */
const RE_TODO = /\b(TODO|FIXME)\b/i

/** Fonction vide (corps `{}` vide sur la même ligne) */
const RE_STUB = /(?:=>\s*\{\s*\}|function\s+\w[^)]*\)\s*\{\s*\})/

// ─── Types ────────────────────────────────────────────────────────────────────

type LineMatch = { line: number; excerpt: string }
type FileReport = {
  rel: string
  lineCount: number
  anyMatches: LineMatch[]
  todoMatches: LineMatch[]
  stubMatches: LineMatch[]
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function print(s = ''): void { process.stdout.write(s + '\n') }

function walkSrc(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return walkSrc(full)
    if (/\.(ts|tsx)$/.test(e.name)) return [full]
    return []
  })
}

function scanLine(line: string, re: RegExp): boolean {
  const stripped = line.replace(/\/\/.*$/, '')   // ignore les commentaires inline
  return re.test(stripped)
}

function toExcerpt(line: string): string {
  const t = line.trim()
  return t.length > 72 ? t.slice(0, 69) + '…' : t
}

function bar(score: number, width = 20): string {
  const filled = Math.round((score / 100) * width)
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']'
}

// ─── Analyse d'un fichier ─────────────────────────────────────────────────────

function analyzeFile(absPath: string, srcRoot: string): FileReport {
  const content = fs.readFileSync(absPath, 'utf-8')
  const lines = content.split('\n')
  const rel = path.relative(srcRoot, absPath)

  const anyMatches: LineMatch[] = []
  const todoMatches: LineMatch[] = []
  const stubMatches: LineMatch[] = []

  lines.forEach((raw, i) => {
    const lineNum = i + 1
    const trimmed = raw.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return

    if (scanLine(raw, RE_ANY))   anyMatches.push({ line: lineNum, excerpt: toExcerpt(raw) })
    if (RE_TODO.test(raw))       todoMatches.push({ line: lineNum, excerpt: toExcerpt(raw) })
    if (scanLine(raw, RE_STUB))  stubMatches.push({ line: lineNum, excerpt: toExcerpt(raw) })
  })

  return { rel, lineCount: lines.length, anyMatches, todoMatches, stubMatches }
}

// ─── Calcul du score ──────────────────────────────────────────────────────────

function computeScore(reports: FileReport[]): { score: number; penalties: string[] } {
  const penalties: string[] = []
  let deductions = 0

  const godFiles = reports.filter((r) => r.lineCount > MAX_FILE_LINES)
  if (godFiles.length) {
    const pts = godFiles.length * PENALTY_GOD_FILE
    deductions += pts
    penalties.push(`${godFiles.length} fichier(s) > ${MAX_FILE_LINES} lignes (−${pts} pts)`)
  }

  const totalAny = reports.reduce((s, r) => s + r.anyMatches.length, 0)
  if (totalAny) {
    const pts = totalAny * PENALTY_ANY
    deductions += pts
    penalties.push(`${totalAny} usage(s) du type générique (−${pts} pts)`)
  }

  const totalTodo = reports.reduce((s, r) => s + r.todoMatches.length, 0)
  if (totalTodo) {
    const pts = totalTodo * PENALTY_TODO
    deductions += pts
    penalties.push(`${totalTodo} marqueur(s) TODO/FIXME (−${pts} pts)`)
  }

  const totalStub = reports.reduce((s, r) => s + r.stubMatches.length, 0)
  if (totalStub) {
    const pts = totalStub * PENALTY_STUB
    deductions += pts
    penalties.push(`${totalStub} stub(s) / fonction(s) vide(s) (−${pts} pts)`)
  }

  return { score: Math.max(0, 100 - deductions), penalties }
}

// ─── Affichage ────────────────────────────────────────────────────────────────

const COL = 52
const RULE = '═'.repeat(COL)

function printMatches(matches: LineMatch[], label: string): void {
  if (matches.length === 0) {
    print(`  ✓  Aucun ${label}`)
    return
  }
  matches.forEach(({ line, excerpt }) =>
    print(`  ⚠  L.${String(line).padEnd(5)} ${excerpt}`)
  )
}

function printSection(
  title: string,
  reports: FileReport[],
  key: keyof Pick<FileReport, 'anyMatches' | 'todoMatches' | 'stubMatches'>,
  label: string,
): void {
  const hits = reports.filter((r) => r[key].length > 0)
  print(`\n┌─ ${title} ${'─'.repeat(Math.max(0, COL - title.length - 4))}`)
  if (hits.length === 0) {
    print(`  ✓  Aucun`)
  } else {
    hits.forEach((r) => {
      print(`  ${r.rel}`)
      printMatches(r[key] as LineMatch[], label)
    })
  }
  print(`└${'─'.repeat(COL - 1)}`)
}

function printReport(reports: FileReport[]): void {
  print(`\nCadence — Audit de dette technique`)
  print(RULE)
  print(`Scanné : ${reports.length} fichiers TypeScript dans src/\n`)

  const godFiles = reports.filter((r) => r.lineCount > MAX_FILE_LINES)
  print(`┌─ Fichiers > ${MAX_FILE_LINES} lignes ${'─'.repeat(COL - 23)}`)
  if (godFiles.length === 0) {
    print(`  ✓  Aucun`)
  } else {
    godFiles.forEach((r) => {
      const overage = `+${r.lineCount - MAX_FILE_LINES}`
      print(`  ⚠  ${r.rel.padEnd(40)} ${r.lineCount} lignes (${overage})`)
    })
  }
  print(`└${'─'.repeat(COL - 1)}`)

  printSection('Utilisations du type générique', reports, 'anyMatches', 'usage')
  printSection('Marqueurs TODO / FIXME', reports, 'todoMatches', 'marqueur')
  printSection('Fonctions vides / stubs', reports, 'stubMatches', 'stub')

  const { score, penalties } = computeScore(reports)
  const icon = score === 100 ? '✓' : score >= 80 ? '⚠' : '✗'
  print(`\n${RULE}`)
  print(`Score de santé : ${score}%  ${bar(score)}  ${icon}`)
  if (penalties.length === 0) {
    print(`Aucune violation détectée — codebase propre.`)
  } else {
    penalties.forEach((p) => print(`  · ${p}`))
  }
  print(RULE)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const argIdx = process.argv.indexOf('--src')
  const srcRoot = argIdx !== -1 && process.argv[argIdx + 1]
    ? path.resolve(process.argv[argIdx + 1])
    : path.join(process.cwd(), 'src')

  if (!fs.existsSync(srcRoot)) {
    console.error(`Erreur : dossier introuvable → ${srcRoot}`)
    process.exit(1)
  }

  const files = walkSrc(srcRoot)
  const reports = files.map((f) => analyzeFile(f, srcRoot))
  printReport(reports)

  const { score } = computeScore(reports)
  process.exit(score === 100 ? 0 : 1)
}

main()
