export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContact(url: string, fields: ContactMessage): Promise<'accepted' | 'unavailable' | 'unknown'> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
      signal: controller.signal,
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('The contact service did not confirm receipt.');
    }
    const data = await response.json();
    if (typeof data?.messageId !== 'string' || !data.messageId.trim() || typeof data.message !== 'string') {
      throw new Error('The contact service returned an incomplete receipt.');
    }
    return data.emailDelivery === 'accepted' ? 'accepted' : data.emailDelivery === 'unavailable' ? 'unavailable' : 'unknown';
  } finally {
    window.clearTimeout(timeout);
  }
}

export function contactEmailLink(recipient: string, fields: ContactMessage) {
  const subject = fields.subject.trim() || 'Portfolio enquiry';
  const body = `${fields.message.trim()}\n\nFrom: ${fields.name.trim()}\nReply to: ${fields.email.trim()}`;
  return `mailto:${encodeURIComponent(recipient.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
