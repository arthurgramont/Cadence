'use client'

import { useState } from 'react'
import { calculateSplits } from '@/lib/utils/splits'
import type { SplitResult } from '@/lib/utils/splits'
import { SplitsResult } from './SplitsResult'

const PRESET_DISTANCES = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: 'Semi', value: 21.0975 },
  { label: 'Marathon', value: 42.195 },
]

const inputClass =
  'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 tabular-nums'

function parseTargetTime(h: string, m: string, s: string): number {
  return parseInt(h || '0', 10) * 3600 + parseInt(m || '0', 10) * 60 + parseInt(s || '0', 10)
}

function TimeUnit({
  label, value, max, placeholder, onChange,
}: {
  label: string; value: string; max: number; placeholder: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <input
        type="number" value={value} onChange={(e) => onChange(e.target.value)}
        min={0} max={max} placeholder={placeholder}
        className={`${inputClass} w-16 text-center`}
      />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

function DistanceInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-2">Distance (km)</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number" value={value} onChange={(e) => onChange(e.target.value)}
          min={0.001} step={0.001} placeholder="10" required
          className={`${inputClass} w-32`}
        />
        <span className="text-xs text-slate-600">ou</span>
        {PRESET_DISTANCES.map((p) => (
          <button
            key={p.label} type="button" onClick={() => onChange(String(p.value))}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              parseFloat(value) === p.value
                ? 'bg-slate-700 border-slate-500 text-slate-100'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SplitsForm({ onCalculated }: { onCalculated: (r: SplitResult | null) => void }) {
  const [distance, setDistance] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    onCalculated(null)
    const distanceKm = parseFloat(distance)
    const targetTimeSeconds = parseTargetTime(hours, minutes, seconds)
    if (isNaN(distanceKm) || distanceKm <= 0)
      return setError('La distance doit être un nombre strictement positif.')
    if (targetTimeSeconds <= 0)
      return setError('Le temps cible doit être supérieur à zéro.')
    try {
      onCalculated(calculateSplits(distanceKm, targetTimeSeconds))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de calcul.')
    }
  }

  return (
    <section className="bg-slate-900 rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <DistanceInput value={distance} onChange={(v) => { setDistance(v); onCalculated(null) }} />
        <div>
          <label className="block text-xs text-slate-400 mb-2">Temps cible</label>
          <div className="flex items-center gap-2">
            <TimeUnit label="h"   value={hours}   max={23} placeholder="0"  onChange={(v) => { setHours(v);   onCalculated(null) }} />
            <span className="text-slate-600 text-lg pb-5">:</span>
            <TimeUnit label="min" value={minutes} max={59} placeholder="39" onChange={(v) => { setMinutes(v); onCalculated(null) }} />
            <span className="text-slate-600 text-lg pb-5">:</span>
            <TimeUnit label="sec" value={seconds} max={59} placeholder="00" onChange={(v) => { setSeconds(v); onCalculated(null) }} />
          </div>
        </div>
        {error && <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" className="bg-slate-100 text-slate-800 text-sm font-medium px-6 py-2 rounded-lg hover:bg-white transition-colors">
            Calculer les splits
          </button>
        </div>
      </form>
    </section>
  )
}

export function SplitsCalculator() {
  const [result, setResult] = useState<SplitResult | null>(null)

  return (
    <div className="space-y-8">
      <SplitsForm onCalculated={setResult} />
      {result && <SplitsResult result={result} />}
    </div>
  )
}
