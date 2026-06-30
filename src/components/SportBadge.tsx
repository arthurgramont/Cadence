const SPORT_STYLES: Record<string, string> = {
  swim: 'bg-blue-900/60 text-blue-300',
  bike: 'bg-yellow-900/60 text-yellow-300',
  run: 'bg-green-900/60 text-green-300',
}

const SPORT_LABELS: Record<string, string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
}

export function SportBadge({ sport, className = '' }: { sport: string; className?: string }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${SPORT_STYLES[sport] ?? 'bg-slate-800 text-slate-300'} ${className}`}
    >
      {SPORT_LABELS[sport] ?? sport}
    </span>
  )
}
