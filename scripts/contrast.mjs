// WCAG contrast check for every text/background pair the site uses.
//   node scripts/contrast.mjs
const pairs = [
  // [label, text, background, min]   min: 4.5 body text, 3 for large text (24px+ / 18.7px bold) and UI borders
  ['Light · ink on surface', '#000000', '#ffffff', 4.5],
  ['Light · ink on surface-alt', '#000000', '#f1eef3', 4.5],
  ['Light · ink-muted on surface', '#4f4f4f', '#ffffff', 4.5],
  ['Light · ink-muted on surface-alt', '#4f4f4f', '#f1eef3', 4.5],
  ['Light · ink-muted on placeholder (surface-muted)', '#4f4f4f', '#eeeeee', 4.5],
  ['Light · accent-strong (links, /POL, secondary btn) on surface', '#8c00ff', '#ffffff', 4.5],
  ['Light · accent-strong on surface-alt (New pill, tabs)', '#8c00ff', '#f1eef3', 4.5],
  ['Light · pink ticker 42px on surface-alt (large, decorative)', '#ff66ed', '#f1eef3', 1.0],
  ['Pink button · ink-on-accent on accent', '#2b0020', '#ff66ed', 4.5],
  ['Pink hover · ink-on-accent on pink-200', '#2b0020', '#fd9cf2', 4.5],
  ['Header · ink on header glass over white', '#000000', '#f6f4f7', 4.5],
  ['Header · white on black (active language pill)', '#ffffff', '#000000', 4.5],
  ['Form · error red on surface-alt', '#b00020', '#f1eef3', 4.5],
  ['Form · success green on its fill', '#0b5a23', '#e6f4ea', 4.5],
  ['Form · error text on its fill', '#8a0019', '#fde8ec', 4.5],
  ['Plum · ink on surface', '#f1eef3', '#2b0020', 4.5],
  ['Plum · ink on surface-alt', '#f1eef3', '#3f273c', 4.5],
  ['Plum · ink-muted on surface', '#c0b8be', '#2b0020', 4.5],
  ['Plum · ink-muted on surface-alt (next-race row, packages)', '#c0b8be', '#3f273c', 4.5],
  ['Plum · accent (month labels, class badges, CTA title) on surface', '#ff66ed', '#2b0020', 4.5],
  ['Plum · accent on surface-alt (next row status)', '#ff66ed', '#3f273c', 4.5],
  ['Plum · accent-strong (secondary btn label) on surface', '#c580ff', '#2b0020', 4.5],
  ['Plum · line (borders, disabled month) on surface — UI only', '#605c5f', '#2b0020', 1.0],
  ['Hero · ink on scrim over placeholder (worst case)', '#f1eef3', '#482140', 4.5],
  ['Hero · accent eyebrow on scrim over placeholder', '#ff66ed', '#482140', 4.5],
  ['Hero · ink-muted sub on scrim over placeholder', '#c0b8be', '#482140', 4.5],
  ['Focus · violet ring on white (non-text 3:1)', '#8c00ff', '#ffffff', 3],
  ['Focus · plum ring inside the glass header (non-text 3:1)', '#2b0020', '#f6f4f7', 3],
  ['Focus · pink ring on the hero scrim (non-text 3:1)', '#ff66ed', '#482140', 3],
  ['Status bar · lilac text on plum', '#f1eef3', '#2b0020', 4.5],
  ['Status bar · pink link on plum', '#ff66ed', '#2b0020', 4.5],
  ['Hero · credential terms (ink-muted) on scrim', '#c0b8be', '#482140', 4.5],
  ['Numbers · ink-muted labels on white', '#4f4f4f', '#ffffff', 4.5],
  ['Pathway · violet line and circles on white (graphic 3:1)', '#8c00ff', '#ffffff', 3],
  ['Pathway · ink-on-accent in the pink Elite circle', '#2b0020', '#ff66ed', 4.5],
  ['Results · pink figures on plum', '#ff66ed', '#2b0020', 4.5],
  ['Results · 2nd place outline on plum (non-text 3:1)', '#f1eef3', '#2b0020', 3],
  ['Results · 3rd place dashed outline (ink-muted) on plum (non-text 3:1)', '#c0b8be', '#2b0020', 3],
  ['Team · violet tab label on lilac', '#8c00ff', '#f1eef3', 4.5],
  ['Team · role text on white card', '#4f4f4f', '#ffffff', 4.5],
  ['Team · plum chip text on white chip', '#2b0020', '#ffffff', 4.5],
  ['Teaser · ink-muted meta on white', '#4f4f4f', '#ffffff', 4.5],
  ['Partner wall · ink-muted tier label on lilac', '#4f4f4f', '#f1eef3', 4.5],
  ['CTA · ink-muted "soon" label on plum', '#c0b8be', '#2b0020', 4.5],
  ['Contact card · text on plum-alt', '#f1eef3', '#3f273c', 4.5],
  ['Footer · #908a8e column labels on plum', '#908a8e', '#2b0020', 4.5],
  ['Footer · input border #908a8e on plum-alt (non-text 3:1)', '#908a8e', '#3f273c', 3],
  ['Footer · placeholder #c0b8be on plum-alt input', '#c0b8be', '#3f273c', 4.5],
  ['Footer · error pink-light on plum', '#ffb3c8', '#2b0020', 4.5],
  ['Media · violet format label on white', '#8c00ff', '#ffffff', 4.5],
  ['Media · pink press title on plum', '#ff66ed', '#2b0020', 4.5],
  ['Ticker pause button · violet border on white (non-text 3:1)', '#8c00ff', '#ffffff', 3],
  ['Focus · pink ring on plum (non-text 3:1)', '#ff66ed', '#2b0020', 3],
];

const lin = (c) => {
  const v = parseInt(c, 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const h = hex.replace('#', '');
  return 0.2126 * lin(h.slice(0, 2)) + 0.7152 * lin(h.slice(2, 4)) + 0.0722 * lin(h.slice(4, 6));
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

let failed = 0;
for (const [label, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${label}`);
}
// Pink on white must never be used for body text: document the ratio that forbids it.
console.log(`\nFor reference: pink #ff66ed on white is ${ratio('#ff66ed', '#ffffff').toFixed(2)}:1 — never used for text on light grounds.`);
process.exit(failed ? 1 : 0);
