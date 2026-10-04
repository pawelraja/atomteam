export function checkGraph(doc: unknown): string[];
export function checkHtml(html: string): { count: number; problems: string[] };
export function checkDir(dir: string): { problems: string[]; blocks: number; pages: number };
