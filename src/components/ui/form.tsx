import type { ReactNode } from 'react'

export const inputClass =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 placeholder:text-slate-500'

export const selectClass =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500'

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function FormBanner({ type, children }: { type: 'error' | 'success'; children: ReactNode }) {
  const cls = type === 'error'
    ? 'mb-4 rounded-lg bg-red-950/60 border border-red-800 px-4 py-2.5 text-sm text-red-300'
    : 'mb-4 rounded-lg bg-green-950/60 border border-green-800 px-4 py-2.5 text-sm text-green-300'
  return <div className={cls}>{children}</div>
}
