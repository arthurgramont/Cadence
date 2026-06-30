'use client'

import { formatTime, formatPace } from '@/lib/utils/splits'
import type { SplitResult } from '@/lib/utils/splits'

export function SplitsResult({ result }: { result: SplitResult }) {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Allure" value={result.paceFormatted} />
        <SummaryCard label="Allure (mile)" value={result.paceMileFormatted} />
        <SummaryCard label={`${result.distanceKm} km`} value={formatTime(result.targetTimeSeconds)} />
      </div>

      <div className="bg-slate-900 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Temps de passage — {result.splits.length} splits
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-2.5 w-20">Km</th>
                <th className="text-right text-xs text-slate-500 font-medium px-4 py-2.5">Split</th>
                <th className="text-right text-xs text-slate-500 font-medium px-4 py-2.5">Passage</th>
              </tr>
            </thead>
            <tbody>
              {result.splits.map((split, i) => {
                const isPartial = split.km !== Math.floor(split.km)
                const kmLabel = isPartial
                  ? split.km.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
                  : String(split.km)
                const isLast = i === result.splits.length - 1

                return (
                  <tr
                    key={split.km}
                    className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/40 ${
                      isLast ? 'bg-slate-800/20' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 tabular-nums">
                      <span className={isPartial ? 'text-slate-400' : 'text-slate-200'}>
                        {kmLabel}
                      </span>
                      {isPartial && (
                        <span className="ml-1.5 text-xs text-slate-600">partiel</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-300">
                      {formatPace(split.splitTimeSeconds)}
                      {isPartial && (
                        <span className="text-slate-600 text-xs ml-1">/km</span>
                      )}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                      isLast ? 'text-amber-400' : 'text-slate-200'
                    }`}>
                      {split.cumulativeTimeFormatted}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold tabular-nums text-slate-100">{value}</p>
    </div>
  )
}
