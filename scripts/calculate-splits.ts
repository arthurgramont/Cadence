/**
 * Calculateur de splits — skill déterministe Cadence
 * Usage : npx tsx scripts/calculate-splits.ts <distanceKm> <tempsSecondes>
 * Exemple : npx tsx scripts/calculate-splits.ts 10 2340
 */

// ─── Types ────────────────────────────────────────────────────────────────────

type Split = {
  km: number
  splitTimeSeconds: number
  cumulativeTimeSeconds: number
  cumulativeTimeFormatted: string
}

type SplitResult = {
  distanceKm: number
  targetTimeSeconds: number
  paceSecondsPerKm: number
  paceFormatted: string
  paceMileFormatted: string
  splits: Split[]
  lastSplitDistanceKm: number | null
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const KM_TO_MILES = 1.60934

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds)
  const h = Math.floor(rounded / 3600)
  const m = Math.floor((rounded % 3600) / 60)
  const s = rounded % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60)
  const s = Math.round(secondsPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// ─── Calcul principal ─────────────────────────────────────────────────────────

function calculateSplits(distanceKm: number, targetTimeSeconds: number): SplitResult {
  if (distanceKm <= 0) throw new Error('La distance doit être strictement positive.')
  if (targetTimeSeconds <= 0) throw new Error('Le temps cible doit être strictement positif.')

  const paceSecondsPerKm = targetTimeSeconds / distanceKm
  const paceMileSecondsPerKm = paceSecondsPerKm * KM_TO_MILES

  const fullKms = Math.floor(distanceKm)
  const remainder = distanceKm - fullKms

  const splits: Split[] = []

  for (let i = 1; i <= fullKms; i++) {
    const cumulative = i * paceSecondsPerKm
    splits.push({
      km: i,
      splitTimeSeconds: paceSecondsPerKm,
      cumulativeTimeSeconds: cumulative,
      cumulativeTimeFormatted: formatTime(cumulative),
    })
  }

  const lastSplitDistanceKm = remainder > 0.001 ? remainder : null

  if (lastSplitDistanceKm !== null) {
    const cumulative = targetTimeSeconds
    splits.push({
      km: distanceKm,
      splitTimeSeconds: lastSplitDistanceKm * paceSecondsPerKm,
      cumulativeTimeSeconds: cumulative,
      cumulativeTimeFormatted: formatTime(cumulative),
    })
  }

  return {
    distanceKm,
    targetTimeSeconds,
    paceSecondsPerKm,
    paceFormatted: `${formatPace(paceSecondsPerKm)} /km`,
    paceMileFormatted: `${formatPace(paceMileSecondsPerKm)} /mile`,
    splits,
    lastSplitDistanceKm,
  }
}

// ─── Affichage terminal ───────────────────────────────────────────────────────

function printResult(result: SplitResult): void {
  const SEP = '════════════════════════════════════════'

  console.log('\nCadence — Calculateur de splits')
  console.log(SEP)
  console.log(`Distance    : ${result.distanceKm.toFixed(4).replace(/\.?0+$/, '')} km`)
  console.log(`Temps cible : ${formatTime(result.targetTimeSeconds)}`)
  console.log(`Allure      : ${result.paceFormatted}  (${result.paceMileFormatted})`)
  console.log(SEP)
  console.log()

  const kmWidth = String(result.distanceKm).length + 1
  const header =
    ` ${' Km'.padStart(kmWidth)} │ Split  │ Passage`
  const divider =
    `─${'─'.repeat(kmWidth + 1)}─┼────────┼─────────`
  const footer =
    `─${'─'.repeat(kmWidth + 1)}─┴────────┴─────────`

  console.log(header)
  console.log(divider)

  for (const split of result.splits) {
    const isPartial = split.km !== Math.floor(split.km)
    const kmLabel = isPartial
      ? split.km.toFixed(4).replace(/\.?0+$/, '')
      : String(split.km)
    const splitFmt = formatPace(split.splitTimeSeconds)
    const line = ` ${kmLabel.padStart(kmWidth)} │  ${splitFmt.padEnd(6)}│  ${split.cumulativeTimeFormatted}`
    console.log(line)
  }

  console.log(footer)
  console.log()
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
    process.exit(1)
  }
}

main()

export { calculateSplits, formatTime, formatPace }
export type { SplitResult, Split }
