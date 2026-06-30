'use client'

import { useState } from 'react'
import { calculateSplits } from '@/lib/utils/splits'
import type { SplitResult } from '@/lib/utils/splits'
import { SplitsResult } from './SplitsResult'

// ─── Distances prédéfinies (raccourcis) ───────────────────────────────────────

const PRESET_DISTANCES = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: 'Semi', value: 21.0975 },
  { label: 'Marathon', value: 42.195 },
]

const inputClass =
  'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 tabular-nums'

// ─── Composant ────────────────────────────────────────────────────────────────

export function SplitsCalculator() {
  const [distance, setDistance] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [result, setResult] = useState<SplitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handlePreset(value: number) {
    setDistance(String(value))
    setResult(null)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    const distanceKm = parseFloat(distance)
    const h = parseInt(hours || '0', 10)
    const m = parseInt(minutes || '0', 10)
    const s = parseInt(seconds || '0', 10)
    const targetTimeSeconds = h * 3600 + m * 60 + s

    if (isNaN(distanceKm) || distanceKm <= 0) {
      setError('La distance doit être un nombre strictement positif.')
      return
    }
    if (targetTimeSeconds <= 0) {
      setError('Le temps cible doit être supérieur à zéro.')
      return
    }

    try {
      setResult(calculateSplits(distanceKm, targetTimeSeconds))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de calcul.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Formulaire */}
      <section className="bg-slate-900 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Distance */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Distance (km)</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                value={distance}
                onChange={(e) => { setDistance(e.target.value); setResult(null) }}
                min={0.001}
                step={0.001}
                placeholder="10"
                required
                className={`${inputClass} w-32`}
              />
              <span className="text-xs text-slate-600">ou</span>
              {PRESET_DISTANCES.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePreset(p.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    parseFloat(distance) === p.value
                      ? 'bg-slate-700 border-slate-500 text-slate-100'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Temps cible */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Temps cible</label>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => { setHours(e.target.value); setResult(null) }}
                  min={0}
                  max={23}
                  placeholder="0"
                  className={`${inputClass} w-16 text-center`}
                />
                <span className="text-xs text-slate-500">h</span>
              </div>
              <span className="text-slate-600 text-lg pb-5">:</span>
              <div className="flex flex-col items-center gap-1">
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => { setMinutes(e.target.value); setResult(null) }}
                  min={0}
                  max={59}
                  placeholder="39"
                  className={`${inputClass} w-16 text-center`}
                />
                <span className="text-xs text-slate-500">min</span>
              </div>
              <span className="text-slate-600 text-lg pb-5">:</span>
              <div className="flex flex-col items-center gap-1">
                <input
                  type="number"
                  value={seconds}
                  onChange={(e) => { setSeconds(e.target.value); setResult(null) }}
                  min={0}
                  max={59}
                  placeholder="00"
                  className={`${inputClass} w-16 text-center`}
                />
                <span className="text-xs text-slate-500">sec</span>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-slate-100 text-slate-800 text-sm font-medium px-6 py-2 rounded-lg hover:bg-white transition-colors"
            >
              Calculer les splits
            </button>
          </div>
        </form>
      </section>

      {/* Résultats */}
      {result && <SplitsResult result={result} />}
    </div>
  )
}
