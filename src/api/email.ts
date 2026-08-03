const EMAIL_API_URL =
  import.meta.env.VITE_EMAIL_API_URL ?? 'https://mail.zquab.com/api/email/send-email/gmail';
const EMAIL_API_KEY = import.meta.env.VITE_EMAIL_API_KEY;

export type ContactTopic = 'General Feedback' | 'Feature Request' | 'Bug / Issue';

export interface SendContactEmailPayload {
  name: string;
  email: string;
  message: string;
  topic: ContactTopic;
  social_profile?: string;
}

const TOPIC_MAP = {
  feedback: 'General Feedback',
  feature: 'Feature Request',
  issue: 'Bug / Issue',
} as const satisfies Record<string, ContactTopic>;

export type ContactCategory = keyof typeof TOPIC_MAP;

export function categoryToTopic(category: ContactCategory): ContactTopic {
  return TOPIC_MAP[category];
}

export function nameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim();
  if (!local) return 'User';

  const formatted = local
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return formatted || 'User';
}

export async function sendContactEmail(payload: SendContactEmailPayload): Promise<void> {
  if (!EMAIL_API_KEY) {
    throw new Error('Email service is not configured.');
  }

  const body: Record<string, string> = {
    name: payload.name,
    email: payload.email,
    message: payload.message,
    brand: import.meta.env.VITE_EMAIL_BRAND ?? 'zquab',
    topic: payload.topic,
  };

  const socialProfile = payload.social_profile?.trim();
  if (socialProfile) {
    body.social_profile = socialProfile;
  }

  const response = await fetch(EMAIL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': EMAIL_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = 'Failed to send message. Please try again.';
    try {
      const errorData = await response.json();
      message = errorData.error || errorData.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }
}
