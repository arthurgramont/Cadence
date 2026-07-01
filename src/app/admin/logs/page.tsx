import { readLogs, type LogEntry, type LogLevel } from '@/lib/utils/logger'

function LevelBadge({ level }: { level: LogLevel }) {
  const styles =
    level === 'ERROR'
      ? 'bg-red-100 text-red-700 border border-red-200'
      : 'bg-green-100 text-green-700 border border-green-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {level}
    </span>
  )
}

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap font-mono">{entry.timestamp}</td>
      <td className="px-4 py-3">
        <LevelBadge level={entry.level} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">{entry.message}</td>
      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
        {entry.context ? JSON.stringify(entry.context) : '—'}
      </td>
    </tr>
  )
}

export default function AdminLogsPage() {
  const logs = readLogs().reverse()

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Logs système</h1>
      <p className="text-sm text-slate-500 mb-6">Stocké dans <code>storage/logs.json</code> — 500 entrées max.</p>
      {logs.length === 0 ? (
        <p className="text-slate-500 italic">Aucun log enregistré.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Horodatage</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Niveau</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Message</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contexte</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => (
                <LogRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-400">{logs.length} entrée(s)</p>
    </main>
  )
}
