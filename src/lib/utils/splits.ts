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
  const m = Math.floor(secondsPerKm / 60)
  const s = Math.round(secondsPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}`
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
