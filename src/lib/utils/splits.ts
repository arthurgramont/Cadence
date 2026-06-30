// ─── Types ────────────────────────────────────────────────────────────────────

export type Split = {
  km: number
  splitTimeSeconds: number
  cumulativeTimeSeconds: number
  cumulativeTimeFormatted: string
}

export type SplitResult = {
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

export function formatTime(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds)
  const h = Math.floor(rounded / 3600)
  const m = Math.floor((rounded % 3600) / 60)
  const s = rounded % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

export function formatPace(secondsPerKm: number): string {
  let m = Math.floor(secondsPerKm / 60)
  let s = Math.round(secondsPerKm % 60)
  if (s === 60) { m += 1; s = 0 }  // carry: 3:60 → 4:00
  return `${m}:${String(s).padStart(2, '0')}`
}

// ─── Formateur Markdown (export webhook) ─────────────────────────────────────

export function formatSplitsMarkdown(result: SplitResult): string {
  const lines: string[] = [
    `## Plan d'allures — ${result.distanceKm} km`,
    ``,
    `| Propriété | Valeur |`,
    `|---|---|`,
    `| Allure cible | ${result.paceFormatted} |`,
    `| Allure (mile) | ${result.paceMileFormatted} |`,
    `| Temps cible | ${formatTime(result.targetTimeSeconds)} |`,
    ``,
    `| Km | Split | Passage |`,
    `|---|---|---|`,
  ]

  for (const split of result.splits) {
    const isPartial = split.km !== Math.floor(split.km)
    const kmLabel = isPartial
      ? `${split.km.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} *(partiel)*`
      : String(split.km)
    lines.push(`| ${kmLabel} | ${formatPace(split.splitTimeSeconds)} /km | **${split.cumulativeTimeFormatted}** |`)
  }

  return lines.join('\n')
}

// ─── Calcul principal ─────────────────────────────────────────────────────────

export function calculateSplits(distanceKm: number, targetTimeSeconds: number): SplitResult {
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
    splits.push({
      km: distanceKm,
      splitTimeSeconds: lastSplitDistanceKm * paceSecondsPerKm,
      cumulativeTimeSeconds: targetTimeSeconds,
      cumulativeTimeFormatted: formatTime(targetTimeSeconds),
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
