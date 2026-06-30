import { describe, it, expect } from 'vitest'
import { calculateSplits, formatTime, formatPace, formatSplitsMarkdown } from './splits'

// ─── calculateSplits ──────────────────────────────────────────────────────────

describe('calculateSplits', () => {

  // ── Distance entière : 10 km / 2400 s (4:00/km exact) ─────────────────────

  describe('10 km en 2400 s (allure 4:00/km)', () => {
    const result = calculateSplits(10, 2400)

    it('retourne la bonne allure en secondes par km', () => {
      expect(result.paceSecondsPerKm).toBe(240)
    })

    it('formate correctement l\'allure /km', () => {
      expect(result.paceFormatted).toBe('4:00 /km')
    })

    it('génère exactement 10 splits', () => {
      expect(result.splits).toHaveLength(10)
    })

    it('chaque split a exactement 240 secondes', () => {
      result.splits.forEach((s) => {
        expect(s.splitTimeSeconds).toBe(240)
      })
    })

    it('les temps cumulés sont des multiples exacts de 240', () => {
      result.splits.forEach((s, i) => {
        expect(s.cumulativeTimeSeconds).toBe((i + 1) * 240)
      })
    })

    it('le dernier split arrive exactement à 2400 s', () => {
      const last = result.splits[result.splits.length - 1]
      expect(last.cumulativeTimeSeconds).toBe(2400)
      expect(last.cumulativeTimeFormatted).toBe('40:00')
    })

    it('n\'a pas de split partiel', () => {
      expect(result.lastSplitDistanceKm).toBeNull()
    })

    it('les numéros de km sont 1 à 10', () => {
      result.splits.forEach((s, i) => {
        expect(s.km).toBe(i + 1)
      })
    })
  })

  // ── Distance non entière : 10.5 km / 2520 s (4:00/km) ─────────────────────

  describe('10.5 km en 2520 s (allure 4:00/km, split partiel)', () => {
    const result = calculateSplits(10.5, 2520)

    it('génère 11 splits au total (10 complets + 1 partiel)', () => {
      expect(result.splits).toHaveLength(11)
    })

    it('les 10 premiers splits sont des km entiers', () => {
      result.splits.slice(0, 10).forEach((s, i) => {
        expect(s.km).toBe(i + 1)
        expect(s.splitTimeSeconds).toBe(240)
      })
    })

    it('le dernier split est partiel et correspond à 0.5 km', () => {
      expect(result.lastSplitDistanceKm).toBeCloseTo(0.5, 5)
    })

    it('le dernier split a un km = 10.5', () => {
      const last = result.splits[result.splits.length - 1]
      expect(last.km).toBe(10.5)
    })

    it('le dernier split dure exactement 0.5 × 240 = 120 s', () => {
      const last = result.splits[result.splits.length - 1]
      expect(last.splitTimeSeconds).toBeCloseTo(120, 5)
    })

    it('le cumul du dernier split est exactement le temps cible (2520 s)', () => {
      const last = result.splits[result.splits.length - 1]
      expect(last.cumulativeTimeSeconds).toBe(2520)
    })
  })

  // ── Distance non entière : 21.0975 km (semi-marathon) ─────────────────────

  describe('21.0975 km en 6300 s (~4:59/km, split partiel réel)', () => {
    const result = calculateSplits(21.0975, 6300)

    it('génère 22 splits au total (21 complets + 1 partiel)', () => {
      expect(result.splits).toHaveLength(22)
    })

    it('le split partiel correspond à 0.0975 km', () => {
      expect(result.lastSplitDistanceKm).toBeCloseTo(0.0975, 3)
    })

    it('le cumul final est exactement le temps cible (6300 s)', () => {
      const last = result.splits[result.splits.length - 1]
      expect(last.cumulativeTimeSeconds).toBe(6300)
    })

    it('l\'allure est cohérente : paceSecondsPerKm ≈ 298.7 s/km', () => {
      expect(result.paceSecondsPerKm).toBeCloseTo(6300 / 21.0975, 8)
    })
  })

  // ── Somme des splits = temps cible ────────────────────────────────────────

  describe('invariant : somme des splits = temps cible', () => {
    it('tient pour un 10 km en 2340 s', () => {
      const result = calculateSplits(10, 2340)
      const sum = result.splits.reduce((acc, s) => acc + s.splitTimeSeconds, 0)
      expect(sum).toBeCloseTo(2340, 5)
    })

    it('tient pour un 42.195 km en 12600 s', () => {
      const result = calculateSplits(42.195, 12600)
      const sum = result.splits.reduce((acc, s) => acc + s.splitTimeSeconds, 0)
      expect(sum).toBeCloseTo(12600, 3)
    })
  })

  // ── Inputs invalides (règles métier CLAUDE.md) ────────────────────────────

  describe('validation des inputs invalides', () => {
    it('lève une erreur si la distance est zéro', () => {
      expect(() => calculateSplits(0, 2400)).toThrow('strictement positive')
    })

    it('lève une erreur si la distance est négative', () => {
      expect(() => calculateSplits(-5, 2400)).toThrow('strictement positive')
    })

    it('lève une erreur si le temps cible est zéro', () => {
      expect(() => calculateSplits(10, 0)).toThrow('strictement positif')
    })

    it('lève une erreur si le temps cible est négatif', () => {
      expect(() => calculateSplits(10, -60)).toThrow('strictement positif')
    })
  })

  // ── Cas limites ──────────────────────────────────────────────────────────

  describe('cas limites', () => {
    it('distance très courte (0.5 km) génère 1 split partiel, pas de splits entiers', () => {
      const result = calculateSplits(0.5, 120)
      expect(result.splits).toHaveLength(1)
      expect(result.lastSplitDistanceKm).toBeCloseTo(0.5, 5)
      expect(result.splits[0].cumulativeTimeSeconds).toBe(120)
    })

    it('distance exactement entière ne génère pas de split partiel', () => {
      expect(calculateSplits(5, 1200).lastSplitDistanceKm).toBeNull()
      expect(calculateSplits(42, 12600).lastSplitDistanceKm).toBeNull()
    })
  })
})

// ─── formatTime ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formate les secondes seules (< 60)', () => {
    expect(formatTime(45)).toBe('0:45')
  })

  it('formate minutes:secondes sans heures', () => {
    expect(formatTime(240)).toBe('4:00')
    expect(formatTime(2340)).toBe('39:00')
    expect(formatTime(3599)).toBe('59:59')
  })

  it('formate h:mm:ss quand >= 3600 s', () => {
    expect(formatTime(3600)).toBe('1:00:00')
    expect(formatTime(6300)).toBe('1:45:00')
    expect(formatTime(12600)).toBe('3:30:00')
  })

  it('arrondit à la seconde la plus proche', () => {
    expect(formatTime(59.6)).toBe('1:00')
    expect(formatTime(59.4)).toBe('0:59')
  })
})

// ─── formatPace ───────────────────────────────────────────────────────────────

describe('formatPace', () => {
  it('formate 240 s/km → "4:00"', () => {
    expect(formatPace(240)).toBe('4:00')
  })

  it('formate 234 s/km → "3:54"', () => {
    expect(formatPace(234)).toBe('3:54')
  })

  it('padde les secondes avec un zéro si < 10', () => {
    expect(formatPace(300)).toBe('5:00')
    expect(formatPace(305)).toBe('5:05')
  })

  it('arrondit la partie secondes', () => {
    expect(formatPace(239.6)).toBe('4:00')
    expect(formatPace(239.4)).toBe('3:59')
  })
})

// ─── formatSplitsMarkdown ─────────────────────────────────────────────────────

describe('formatSplitsMarkdown', () => {
  it('contient l\'en-tête, l\'allure et le temps cible', () => {
    const result = calculateSplits(10, 2400)
    const md = formatSplitsMarkdown(result)
    expect(md).toContain("## Plan d'allures — 10 km")
    expect(md).toContain('| Allure cible | 4:00 /km |')
    expect(md).toContain('| Temps cible | 40:00 |')
  })

  it('contient les en-têtes du tableau de splits avec séparateurs', () => {
    const md = formatSplitsMarkdown(calculateSplits(5, 1200))
    expect(md).toContain('| Km | Split | Passage |')
    expect(md).toContain('|---|---|---|')
  })
  it('contient une ligne par split numérotée et le passage final en gras', () => {
    const result = calculateSplits(10, 2400)
    const md = formatSplitsMarkdown(result)
    expect(md).toContain('| 1 |')
    expect(md).toContain('| 10 |')
    expect(md).toContain('**40:00**')
  })

  it('marque les splits partiels avec *(partiel)*', () => {
    expect(formatSplitsMarkdown(calculateSplits(10.5, 2520))).toContain('*(partiel)*')
  })
  it('génère exactement autant de lignes de données que de splits', () => {
    const result = calculateSplits(5, 1200)
    const md = formatSplitsMarkdown(result)
    const dataRows = md.split('\n').filter(
      (l) => l.startsWith('|') && !l.startsWith('|---') && !l.includes('Km')
        && !l.includes('Allure') && !l.includes('Propriété') && !l.includes('Temps cible'),
    )
    expect(dataRows).toHaveLength(5)
  })
})
