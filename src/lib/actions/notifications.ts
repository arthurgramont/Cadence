'use server'

export type NotificationState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

/**
 * Envoie un plan d'allures formaté en Markdown vers un webhook externe (POST JSON).
 *
 * Variables d'environnement :
 *   WEBHOOK_URL — URL du destinataire (ex: Slack, Discord, n8n, Make).
 *                 Si absente, l'action retourne une erreur sans crash.
 *
 * Payload envoyé : { text: string, content: string, source: string }
 *   – text    : champ attendu par Slack / Integromat
 *   – content : champ attendu par Discord
 */
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

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: markdown, content: markdown, source: 'Cadence — Calculateur de splits' }),
    })

    if (!response.ok) {
      console.error('[sendSplitsNotification] HTTP', response.status, webhookUrl)
      return { status: 'error', message: `Le webhook a répondu avec le statut ${response.status}.` }
    }

    return { status: 'success', message: "Plan d'allures exporté avec succès." }
  } catch (err) {
    console.error('[sendSplitsNotification]', err)
    return { status: 'error', message: "Erreur réseau. Vérifiez l'URL du webhook." }
  }
}
