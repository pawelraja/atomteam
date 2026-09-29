// WAI-ARIA tabs (automatic activation): arrow keys move focus + selection, Home/End jump.
export function initTabs(root: HTMLElement, onChange?: (tab: HTMLElement) => void) {
  const tabs = [...root.querySelectorAll<HTMLElement>(':scope [role="tab"]')].filter(
    (t) => t.closest('[data-tabs]') === root,
  );
  const select = (tab: HTMLElement, focus = true) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls')!);
      if (panel) panel.hidden = !on;
    }
    if (focus) tab.focus();
    onChange?.(tab);
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const k = e.key;
      let next: number | null = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') next = (i + 1) % tabs.length;
      if (k === 'ArrowLeft' || k === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      if (k === 'Home') next = 0;
      if (k === 'End') next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        select(tabs[next]);
      }
    });
  });
  return { select: (tab: HTMLElement, focus = false) => select(tab, focus), tabs };
}
