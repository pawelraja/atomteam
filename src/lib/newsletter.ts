// Where the newsletter form sends sign-ups, chosen at build time from environment variables:
//   MAILERLITE_ACCOUNT_ID + MAILERLITE_FORM_ID  → MailerLite embedded-form endpoint (both numbers
//     are in the form's public embed code; not secrets). Optional MAILERLITE_LANGUAGE_FIELD: the
//     key of a MailerLite custom field that should receive "pl" / "en".
//   NEWSLETTER_ENDPOINT                         → any endpoint that accepts JSON { email, consent, lang }
//   neither                                     → the form explains that sign-ups open soon.
const env = (k: string): string => (import.meta.env?.[k] as string | undefined) || process.env[k] || '';

export type NewsletterConfig =
  | { mode: 'mailerlite'; action: string; emailField: string; langField: string }
  | { mode: 'json'; action: string; emailField: string; langField: string }
  | { mode: 'off'; action: null; emailField: string; langField: string };

export function newsletterConfig(): NewsletterConfig {
  const account = env('MAILERLITE_ACCOUNT_ID');
  const form = env('MAILERLITE_FORM_ID');
  if (account && form) {
    if (!/^\d+$/.test(account) || !/^\d+$/.test(form)) throw new Error('MAILERLITE_ACCOUNT_ID and MAILERLITE_FORM_ID must be the numbers from the MailerLite embed code.');
    const langKey = env('MAILERLITE_LANGUAGE_FIELD');
    return {
      mode: 'mailerlite',
      action: `https://assets.mailerlite.com/jsonp/${account}/forms/${form}/subscribe`,
      emailField: 'fields[email]',
      langField: langKey ? `fields[${langKey}]` : 'lang',
    };
  }
  const endpoint = env('NEWSLETTER_ENDPOINT');
  if (endpoint) return { mode: 'json', action: endpoint, emailField: 'email', langField: 'lang' };
  return { mode: 'off', action: null, emailField: 'email', langField: 'lang' };
}

/** Seconds a visitor waits between two sign-up attempts (a light client-side rate limit). */
export const NEWSLETTER_COOLDOWN_S = 30;
