// /media/portrety/<file>: the original rider portrait (src/assets/riders/) as a direct download.
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { getData } from '../../../lib/data';
import { findOriginal } from '../../../lib/images';

export const getStaticPaths: GetStaticPaths = () =>
  getData()
    .riders.map((r) => findOriginal('riders', r.photo))
    .filter((o) => o !== undefined)
    .map((o) => ({ params: { file: o.name }, props: { path: o.path } }));

const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };

export const GET: APIRoute = ({ props, params }) =>
  new Response(new Uint8Array(readFileSync(props.path as string)), {
    headers: { 'Content-Type': TYPES[String(params.file).split('.').pop()!] ?? 'application/octet-stream' },
  });
