// /robots.txt: search engines and AI assistants are explicitly welcome. Each crawler has its own
// group with a comment saying what it does, so the team can change policy per crawler later
// (replace "Allow: /" with "Disallow: /" in that group).
import type { APIRoute } from 'astro';
import { TEAM } from '../lib/team';

const CRAWLERS: { agent: string; what: string }[] = [
  { agent: 'Googlebot', what: 'Google Search (also feeds AI Overviews and AI Mode).' },
  { agent: 'Bingbot', what: 'Bing Search (also feeds Microsoft Copilot, and ChatGPT search results via Bing).' },
  { agent: 'OAI-SearchBot', what: 'OpenAI: indexes pages so ChatGPT search can show and link to them. Not used for training.' },
  { agent: 'ChatGPT-User', what: 'OpenAI: fetches a page when a ChatGPT user or custom GPT asks about it, live.' },
  { agent: 'GPTBot', what: 'OpenAI: collects public pages that may be used to train OpenAI models. Disallow to opt out of training only.' },
  { agent: 'ClaudeBot', what: 'Anthropic: collects public pages that may be used to train Claude models. Disallow to opt out of training only.' },
  { agent: 'Claude-SearchBot', what: 'Anthropic: indexes pages so Claude can cite them in search answers.' },
  { agent: 'Claude-User', what: 'Anthropic: fetches a page when a Claude user asks about it, live.' },
  { agent: 'PerplexityBot', what: 'Perplexity: indexes pages so Perplexity answers can cite and link them.' },
  { agent: 'Perplexity-User', what: 'Perplexity: fetches a page when a Perplexity user asks about it, live.' },
  { agent: 'Google-Extended', what: 'Google: permission token for Gemini training and grounding. It is not a separate crawler and does not affect Google Search.' },
  { agent: 'Applebot', what: 'Apple: Siri and Spotlight search suggestions.' },
  { agent: 'Applebot-Extended', what: 'Apple: permission token for Apple Intelligence training. Does not affect Siri or Spotlight.' },
];

export const GET: APIRoute = () => {
  const groups = CRAWLERS.map((c) => `# ${c.what}\nUser-agent: ${c.agent}\nAllow: /`);
  const body = [
    `# robots.txt for ${TEAM.website}`,
    '# Policy (October 2026): the team wants search engines and AI assistants to find, quote and link',
    '# the site, so every crawler below is allowed everywhere. To change the policy for one crawler,',
    '# replace "Allow: /" with "Disallow: /" in its group. Edit src/pages/robots.txt.ts.',
    '',
    ...groups.flatMap((g) => [g, '']),
    '# Every other crawler.',
    'User-agent: *',
    'Allow: /',
    '',
    '# Summary for AI assistants: /llms.txt (full text: /llms-full.txt)',
    `Sitemap: ${new URL('/sitemap.xml', TEAM.website).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
