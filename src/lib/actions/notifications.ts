'use server'

import { logInfo, logError } from '@/lib/utils/logger'

export type NotificationState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export async function sendSplitsNotification(
  _prevState: NotificationState,
  formData: FormData,
): Promise<NotificationState> {
  const webhookUrl = process.env.WEBHOOK_URL
  if (!webhookUrl) {
    return { status: 'error', message: 'Variable WEBHOOK_URL non configurée dans .env.local.' }
  }

  const markdown = formData.get('markdown') as string
  if (!markdown) {
    return { status: 'error', message: "Contenu du plan d'allures manquant." }
  }

  let response: Response
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: markdown, content: markdown, source: 'Cadence — Calculateur de splits' }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    logError('Erreur réseau sendSplitsNotification', { error: message })
    return { status: 'error', message: "Erreur réseau. Vérifiez l'URL du webhook." }
  }

  if (!response.ok) {
    logError('Webhook HTTP error', { status: String(response.status), url: webhookUrl })
    return { status: 'error', message: `Le webhook a répondu avec le statut ${response.status}.` }
  }

  logInfo('Webhook sendSplitsNotification success', { status: String(response.status) })
  return { status: 'success', message: "Plan d'allures exporté avec succès." }
}
