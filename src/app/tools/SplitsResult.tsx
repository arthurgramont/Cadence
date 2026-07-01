'use client'

import { useActionState } from 'react'
import { formatTime, formatPace, formatSplitsMarkdown } from '@/lib/utils/splits'
import type { Split, SplitResult } from '@/lib/utils/splits'
import { sendSplitsNotification, type NotificationState } from '@/lib/actions'

const initialNotifState: NotificationState = { status: 'idle' }

function SplitRow({ split, isLast }: { split: Split; isLast: boolean }) {
  const isPartial = split.km !== Math.floor(split.km)
  const kmLabel = isPartial
    ? split.km.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
    : String(split.km)
  return (
    <tr
      key={split.km}
      className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/40 ${isLast ? 'bg-slate-800/20' : ''}`}
    >
      <td className="px-4 py-2.5 tabular-nums">
        <span className={isPartial ? 'text-slate-400' : 'text-slate-200'}>{kmLabel}</span>
        {isPartial && <span className="ml-1.5 text-xs text-slate-600">partiel</span>}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-slate-300">
        {formatPace(split.splitTimeSeconds)}
        {isPartial && <span className="text-slate-600 text-xs ml-1">/km</span>}
      </td>
      <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${isLast ? 'text-amber-400' : 'text-slate-200'}`}>
        {split.cumulativeTimeFormatted}
      </td>
    </tr>
  )
}

function SplitsTable({ splits }: { splits: SplitResult['splits'] }) {
  return (
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
          {splits.map((split, i) => (
            <SplitRow key={split.km} split={split} isLast={i === splits.length - 1} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExportBar({ notifAction, notifState, isNotifPending, markdown }: {
  notifAction: (payload: FormData) => void
  notifState: NotificationState
  isNotifPending: boolean
  markdown: string
}) {
  return (
    <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-4">
      <NotifFeedback state={notifState} />
      <form action={notifAction}>
        <input type="hidden" name="markdown" value={markdown} />
        <button
          type="submit"
          disabled={isNotifPending || notifState.status === 'success'}
          className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border transition-colors
            bg-slate-800 border-slate-700 text-slate-300
            hover:bg-slate-700 hover:border-slate-500 hover:text-slate-100
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>{isNotifPending ? 'Envoi…' : "↗ Exporter le plan d'allures"}</span>
        </button>
      </form>
    </div>
  )
}

export function SplitsResult({ result }: { result: SplitResult }) {
  const [notifState, notifAction, isNotifPending] = useActionState(sendSplitsNotification, initialNotifState)
  const markdown = formatSplitsMarkdown(result)

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
        <SplitsTable splits={result.splits} />
        <ExportBar notifAction={notifAction} notifState={notifState} isNotifPending={isNotifPending} markdown={markdown} />
      </div>
    </section>
  )
}

function NotifFeedback({ state }: { state: NotificationState }) {
  if (state.status === 'idle') return <span />
  return (
    <p className={`text-xs ${state.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
      {state.message}
    </p>
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
