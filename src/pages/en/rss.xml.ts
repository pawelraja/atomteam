// RSS feed of race results in English (see src/lib/feed.ts).
import { rssFeed } from '../../lib/feed';

export const GET = () => new Response(rssFeed('en'), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
