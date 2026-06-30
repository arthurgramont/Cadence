/**
 * Calculateur de splits — skill déterministe Cadence (CLI)
 * Usage : npx tsx scripts/calculate-splits.ts <distanceKm> <tempsSecondes>
 * Exemple : npx tsx scripts/calculate-splits.ts 10 2340
 *
 * La logique de calcul est dans src/lib/utils/splits.ts (partagée avec l'UI).
 */

import { calculateSplits, formatTime, formatPace } from '../src/lib/utils/splits'
import type { SplitResult } from '../src/lib/utils/splits'

function print(s = ''): void { process.stdout.write(s + '\n') }

// ─── Affichage terminal ───────────────────────────────────────────────────────

function printResult(result: SplitResult): void {
  const SEP = '════════════════════════════════════════'

  print('\nCadence — Calculateur de splits')
  print(SEP)
  print(`Distance    : ${result.distanceKm.toFixed(4).replace(/\.?0+$/, '')} km`)
  print(`Temps cible : ${formatTime(result.targetTimeSeconds)}`)
  print(`Allure      : ${result.paceFormatted}  (${result.paceMileFormatted})`)
  print(SEP)
  print()

  const kmWidth = String(result.distanceKm).length + 1
  const header = ` ${' Km'.padStart(kmWidth)} │ Split  │ Passage`
  const divider = `─${'─'.repeat(kmWidth + 1)}─┼────────┼─────────`
  const footer = `─${'─'.repeat(kmWidth + 1)}─┴────────┴─────────`

  print(header)
  print(divider)

  for (const split of result.splits) {
    const isPartial = split.km !== Math.floor(split.km)
    const kmLabel = isPartial
      ? split.km.toFixed(4).replace(/\.?0+$/, '')
      : String(split.km)
    const splitFmt = formatPace(split.splitTimeSeconds)
    const line = ` ${kmLabel.padStart(kmWidth)} │  ${splitFmt.padEnd(6)}│  ${split.cumulativeTimeFormatted}`
    print(line)
  }

  print(footer)
  print()
}

// ─── Entrée CLI ───────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2)

  if (args.length !== 2) {
    console.error('Usage : npx tsx scripts/calculate-splits.ts <distanceKm> <tempsSecondes>')
    console.error('Exemple : npx tsx scripts/calculate-splits.ts 10 2340')
    process.exit(1)
  }

  const distanceKm = parseFloat(args[0])
  const targetTimeSeconds = parseFloat(args[1])

  if (isNaN(distanceKm) || isNaN(targetTimeSeconds)) {
    console.error('Erreur : les deux arguments doivent être des nombres.')
    process.exit(1)
  }

  try {
    const result = calculateSplits(distanceKm, targetTimeSeconds)
    printResult(result)
  } catch (err) {
    console.error('Erreur :', err instanceof Error ? err.message : err)
    throw err
  }
}

main()
