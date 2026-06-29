import { db } from '@/db'
import { gear } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { EditGearForm } from './EditGearForm'

export default async function EditGearPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const item = await db.select().from(gear).where(eq(gear.id, id)).limit(1).then((r) => r[0])

  if (!item) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-100">Modifier le matériel</h1>
      <EditGearForm gear={item} />
    </div>
  )
}
