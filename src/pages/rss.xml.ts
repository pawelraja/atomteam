// RSS feed of race results in Polish (see src/lib/feed.ts).
import { rssFeed } from '../lib/feed';

export const GET = () => new Response(rssFeed('pl'), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
