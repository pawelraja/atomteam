// /media/foto/<file>: the original, full-resolution press photo (src/assets/media/), served as a
// plain file so journalists get a stable download address.
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { getData } from '../../../lib/data';
import { assertPressQuality } from '../../../lib/images';

export const getStaticPaths: GetStaticPaths = () =>
  getData()
    .media.photos.map((p) => assertPressQuality(p.file))
    .filter((o) => o !== undefined)
    .map((o) => ({ params: { file: o.name }, props: { path: o.path } }));

const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };

export const GET: APIRoute = ({ props, params }) =>
  new Response(new Uint8Array(readFileSync(props.path as string)), {
    headers: { 'Content-Type': TYPES[String(params.file).split('.').pop()!] ?? 'application/octet-stream' },
  });
