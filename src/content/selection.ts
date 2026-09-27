import { formatAge, formatAmount, formatMoney, formatRate } from '../lib/format';
import { findPrices, hintsFromPage, type PriceMatch } from '../lib/price/parse';
import { convert, crossRate } from '../lib/rates';
import type { RatesState } from '../lib/types';
import { getHost, isInsideHost } from './host';

export type SelectionCtx = { enabled: boolean; primary: string; rates: RatesState | null };

const DEBOUNCE_MS = 150;
const CARD_GAP = 8;
const VIEWPORT_MARGIN = 4;
const MAX_MATCHES = 3;
const MAX_SELECTION_LENGTH = 64;
const COPY_RESET_MS = 1500;

let ctx: SelectionCtx = { enabled: false, primary: 'USD', rates: null };
let card: HTMLDivElement | null = null;
let attached = false;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let copyResetTimer: ReturnType<typeof setTimeout> | undefined;

/** Enable/disable the selection card and keep it in sync with settings and rates. */
export function syncSelection(next: SelectionCtx): void {
  const wasEnabled = ctx.enabled;
  ctx = next;
  if (!attached) attachListeners();
  if (wasEnabled && !next.enabled) hideCard();
}

function attachListeners(): void {
  attached = true;
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('mousedown', onMouseDown, true);
  document.addEventListener('scroll', hideCard, true);
  window.addEventListener('resize', hideCard);
}

function onMouseUp(e: MouseEvent): void {
  // Clicks inside the card (Copy, ✕) must not re-render it.
  if (isInsideHost(e.target as Node | null)) return;
  scheduleCheck();
}

function onKeyUp(e: KeyboardEvent): void {
  if (e.key === 'Shift' || e.key.startsWith('Arrow')) scheduleCheck();
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') hideCard();
}

function onMouseDown(e: MouseEvent): void {
  if (!card) return;
  const target = e.target;
  if (target instanceof Node && !card.contains(target) && !isInsideHost(target)) hideCard();
}

function scheduleCheck(): void {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(check, DEBOUNCE_MS);
}

function check(): void {
  if (!ctx.enabled || !ctx.rates) {
    hideCard();
    return;
  }
  const selection = window.getSelection();
  const text = selection?.toString().trim() ?? '';
  if (!text || text.length > MAX_SELECTION_LENGTH || !selection?.rangeCount) {
    hideCard();
    return;
  }
  const matches = findPrices(text, hintsFromPage())
    .filter((m) => m.currency !== ctx.primary)
    .slice(0, MAX_MATCHES);
  if (matches.length === 0) {
    hideCard();
    return;
  }
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  showCard(matches, rect);
}

function showCard(matches: PriceMatch[], rect: DOMRect): void {
  const rates = ctx.rates;
  if (!rates) return;
  const shadow = getHost();
  if (!card) {
    card = document.createElement('div');
    card.className = 'curratio-selection-card';
    shadow.appendChild(card);
  }
  card.replaceChildren(
    buildLines(matches, rates),
    buildSub(matches[0], rates),
    buildActions(matches[0], rates),
  );
  positionCard(rect);
}

function buildLines(matches: PriceMatch[], rates: RatesState): HTMLDivElement {
  const lines = document.createElement('div');
  lines.className = 'curratio-selection-lines';
  for (const m of matches) {
    const value = convert(rates.rates, m.amount, m.currency, ctx.primary);
    const line = document.createElement('div');
    line.className = 'curratio-selection-line';
    const orig = document.createTextNode(`${formatAmount(m.amount, m.currency)} ${m.currency} ≈ `);
    const result = document.createElement('strong');
    result.textContent = value === null ? '—' : formatMoney(value, ctx.primary, navigator.language);
    line.append(orig, result);
    lines.appendChild(line);
  }
  return lines;
}

function buildSub(first: PriceMatch, rates: RatesState): HTMLDivElement {
  const rate = crossRate(rates.rates, first.currency, ctx.primary);
  const sub = document.createElement('div');
  sub.className = 'curratio-selection-sub';
  sub.textContent = `1 ${first.currency} = ${formatRate(rate)} ${ctx.primary} · ${formatAge(Date.now() - rates.fetchedAt)}`;
  return sub;
}

function buildActions(first: PriceMatch, rates: RatesState): HTMLDivElement {
  const actions = document.createElement('div');
  actions.className = 'curratio-selection-actions';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'curratio-selection-copy';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => {
    const value = convert(rates.rates, first.amount, first.currency, ctx.primary);
    if (value !== null) {
      navigator.clipboard
        .writeText(`${formatAmount(value, ctx.primary)} ${ctx.primary}`)
        .catch((e) => console.warn('[curratio] copy failed', e));
    }
    copyBtn.textContent = 'Copied';
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copyBtn.textContent = 'Copy';
    }, COPY_RESET_MS);
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'curratio-selection-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', hideCard);

  actions.append(copyBtn, closeBtn);
  return actions;
}

function positionCard(rect: DOMRect): void {
  if (!card) return;
  card.classList.add('curratio-measuring');
  const cardRect = card.getBoundingClientRect();

  let top = rect.bottom + CARD_GAP;
  const above = rect.top - CARD_GAP - cardRect.height;
  if (top + cardRect.height > window.innerHeight && above >= 0) top = above;

  const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - cardRect.width - VIEWPORT_MARGIN);
  const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - cardRect.height - VIEWPORT_MARGIN);
  const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN), maxLeft);
  top = Math.min(Math.max(top, VIEWPORT_MARGIN), maxTop);

  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
  card.classList.remove('curratio-measuring');
}

function hideCard(): void {
  card?.remove();
  card = null;
}
