import type { Metadata } from 'next'
import { SplitsCalculator } from './SplitsCalculator'

export const metadata: Metadata = {
  title: 'Calculateur de splits — Cadence',
  description: 'Calculez votre allure cible et vos temps de passage kilomètre par kilomètre.',
}

export default function ToolsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Calculateur de splits</h1>
        <p className="text-sm text-slate-500 mt-1">
          Allure cible et temps de passage kilomètre par kilomètre.
        </p>
      </div>
      <SplitsCalculator />
    </div>
  )
}
