import { createHmac, timingSafeEqual } from 'crypto';

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signatureHeader?.startsWith('sha256=')) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = signatureHeader.slice('sha256='.length);

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

export interface ParsedInstagramMessage {
  pageId: string;
  senderId: string;
  recipientId: string;
  messageId: string;
  text: string;
  timestamp: number;
}

export function parseInstagramMessages(body: unknown): ParsedInstagramMessage[] {
  const results: ParsedInstagramMessage[] = [];
  const payload = body as {
    object?: string;
    entry?: Array<{
      id?: string;
      messaging?: Array<{
        sender?: { id?: string };
        recipient?: { id?: string };
        timestamp?: number;
        message?: { mid?: string; text?: string };
      }>;
    }>;
  };

  if (payload.object !== 'instagram') return results;

  for (const entry of payload.entry ?? []) {
    const pageId = entry.id ?? '';
    for (const event of entry.messaging ?? []) {
      const text = event.message?.text?.trim();
      const messageId = event.message?.mid;
      const senderId = event.sender?.id;
      if (!text || !messageId || !senderId) continue;

      results.push({
        pageId,
        senderId,
        recipientId: event.recipient?.id ?? '',
        messageId,
        text,
        timestamp: event.timestamp ?? Date.now(),
      });
    }
  }

  return results;
}
