import { formatMoney } from '../lib/format';
import { findPrices, hintsFromPage, type PriceHints, type PriceMatch } from '../lib/price/parse';
import { convert } from '../lib/rates';
import type { UsdRates } from '../lib/types';
import { isInsideHost } from './host';
import pageCss from './page.css?inline';

export type PageConvertCtx = { enabled: boolean; target: string; rates: UsdRates | null };

const PAGE_STYLE_ID = 'curratio-page';
const CHUNK_SIZE = 500;
const MUTATION_DEBOUNCE_MS = 300;
const MAX_SPLIT_DESCENDANTS = 6;
const MAX_SPLIT_TEXT_LENGTH = 40;
const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEXTAREA',
  'INPUT',
  'SELECT',
  'CODE',
  'PRE',
  'SVG',
]);
const BLOCK_DISPLAYS = new Set(['block', 'flex', 'grid', 'list-item', 'table', 'table-row']);

type SplitCandidate = { el: Element; match: PriceMatch };

let current: PageConvertCtx = { enabled: false, target: 'USD', rates: null };
let observer: MutationObserver | null = null;
let mutationTimer: ReturnType<typeof setTimeout> | undefined;
const pendingRoots = new Set<Element>();
const originalChildren = new WeakMap<Element, Node[]>();

/** Reconcile page conversion with the latest settings/rates. Safe to call on every change. */
export function syncPageConvert(next: PageConvertCtx): void {
  const prev = current;
  current = next;

  if (!next.enabled) {
    if (prev.enabled) {
      revertAll();
      stopObserver();
    }
    return;
  }

  if (!prev.enabled) {
    ensurePageStyle();
    startObserver();
    scanRoot(document.body);
    return;
  }
  if (next.target !== prev.target) {
    revertAll();
    scanRoot(document.body);
    return;
  }
  if (!prev.rates && next.rates) {
    scanRoot(document.body);
    return;
  }
  if (next.rates !== prev.rates) {
    recomputeAll();
  }
}

function ensurePageStyle(): void {
  if (document.getElementById(PAGE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PAGE_STYLE_ID;
  style.textContent = pageCss;
  (document.head ?? document.documentElement).appendChild(style);
}

function startObserver(): void {
  if (observer) return;
  observer = new MutationObserver(onMutations);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function stopObserver(): void {
  observer?.disconnect();
  observer = null;
  pendingRoots.clear();
  clearTimeout(mutationTimer);
}

function withObserverPaused(fn: () => void): void {
  const wasObserving = !!observer;
  observer?.disconnect();
  try {
    fn();
  } finally {
    if (wasObserving) {
      observer?.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }
}

function onMutations(records: MutationRecord[]): void {
  for (const record of records) {
    const el = record.target instanceof Element ? record.target : record.target.parentElement;
    if (el && !isInsideHost(el)) pendingRoots.add(el);
  }
  clearTimeout(mutationTimer);
  mutationTimer = setTimeout(flushMutations, MUTATION_DEBOUNCE_MS);
}

function flushMutations(): void {
  const roots = Array.from(pendingRoots);
  pendingRoots.clear();
  for (const root of roots) {
    if (document.contains(root) && !isInsideHost(root)) scanRoot(root);
  }
}

function scanRoot(root: Element): void {
  if (!current.rates) return;
  const hints = hintsFromPage();

  const splitCandidates: SplitCandidate[] = [];
  findSplitPriceCandidates(root, hints, splitCandidates);
  processInChunks(splitCandidates, ({ el, match }) => convertSplitPrice(el, match));

  const textNodes = collectTextNodes(
    root,
    splitCandidates.map((c) => c.el),
  );
  processInChunks(textNodes, (node) => convertTextNode(node, hints));
}

function isElementSkippable(el: Element): boolean {
  return (
    SKIP_TAGS.has(el.tagName.toUpperCase()) ||
    el.hasAttribute('contenteditable') ||
    el.hasAttribute('data-curratio')
  );
}

function isBlockLevel(el: Element): boolean {
  return BLOCK_DISPLAYS.has(getComputedStyle(el).display);
}

function hasBlockDescendant(el: Element): boolean {
  return Array.from(el.querySelectorAll('*')).some((d) => isBlockLevel(d));
}

/** Find the outermost elements whose entire trimmed text is exactly one price. */
function findSplitPriceCandidates(root: Element, hints: PriceHints, out: SplitCandidate[]): void {
  for (const child of Array.from(root.children)) {
    if (isInsideHost(child) || isElementSkippable(child)) continue;

    const text = (child.textContent ?? '').trim();
    const descendantCount = child.querySelectorAll('*').length;
    if (
      text.length > 0 &&
      text.length <= MAX_SPLIT_TEXT_LENGTH &&
      descendantCount <= MAX_SPLIT_DESCENDANTS &&
      !hasBlockDescendant(child)
    ) {
      const matches = findPrices(text, hints);
      if (matches.length === 1 && matches[0].start === 0 && matches[0].end === text.length) {
        // Already in the target currency: leave it (and its children) alone.
        if (matches[0].currency !== current.target) out.push({ el: child, match: matches[0] });
        continue; // outermost match only; don't descend into it
      }
    }
    findSplitPriceCandidates(child, hints, out);
  }
}

function collectTextNodes(root: Element, excludeAncestors: Element[]): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || isInsideHost(parent)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      if (hasSkippableAncestor(parent)) return NodeFilter.FILTER_REJECT;
      if (excludeAncestors.some((a) => a.contains(parent))) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

function hasSkippableAncestor(el: Element): boolean {
  let cur: Element | null = el;
  while (cur) {
    if (isElementSkippable(cur)) return true;
    cur = cur.parentElement;
  }
  return false;
}

function processInChunks<T>(items: T[], worker: (item: T) => void): void {
  let i = 0;
  const step = (): void => {
    const end = Math.min(i + CHUNK_SIZE, items.length);
    withObserverPaused(() => {
      for (; i < end; i++) worker(items[i]);
    });
    if (i < items.length) scheduleIdle(step);
  };
  scheduleIdle(step);
}

function scheduleIdle(fn: () => void): void {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(fn);
  else setTimeout(fn, 0);
}

function formatConverted(amount: number, from: string): string {
  const rates = current.rates;
  const value = rates ? convert(rates, amount, from, current.target) : null;
  if (value === null) return '—';
  const locale = document.documentElement.lang || navigator.language;
  return formatMoney(value, current.target, locale);
}

function convertSplitPrice(el: Element, match: PriceMatch): void {
  originalChildren.set(el, Array.from(el.childNodes));
  const title = el.getAttribute('title');
  if (title !== null) el.setAttribute('data-curratio-title', title);
  el.setAttribute('data-curratio', '');
  el.setAttribute('data-curratio-amount', String(match.amount));
  el.setAttribute('data-curratio-currency', match.currency);
  el.setAttribute('title', `Original: ${match.raw}`);
  el.replaceChildren(document.createTextNode(formatConverted(match.amount, match.currency)));
}

function convertTextNode(node: Text, hints: PriceHints): void {
  const text = node.nodeValue ?? '';
  const matches = findPrices(text, hints).filter((m) => m.currency !== current.target);
  if (matches.length === 0) return;
  const parent = node.parentNode;
  if (!parent) return;

  const frag = document.createDocumentFragment();
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, m.start)));
    const span = document.createElement('span');
    span.setAttribute('data-curratio', '');
    span.setAttribute('data-curratio-amount', String(m.amount));
    span.setAttribute('data-curratio-currency', m.currency);
    span.setAttribute('data-curratio-orig', m.raw);
    span.setAttribute('title', `Original: ${m.raw}`);
    span.textContent = formatConverted(m.amount, m.currency);
    frag.appendChild(span);
    cursor = m.end;
  }
  if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));
  parent.replaceChild(frag, node);
}

function recomputeAll(): void {
  withObserverPaused(() => {
    document.querySelectorAll('[data-curratio]').forEach((el) => {
      const amount = Number(el.getAttribute('data-curratio-amount'));
      const currency = el.getAttribute('data-curratio-currency');
      if (!Number.isFinite(amount) || !currency) return;
      el.textContent = formatConverted(amount, currency);
    });
  });
}

function revertAll(): void {
  withObserverPaused(() => {
    document.querySelectorAll('[data-curratio]').forEach((el) => {
      const orig = el.getAttribute('data-curratio-orig');
      if (orig !== null) {
        el.replaceWith(document.createTextNode(orig));
        return;
      }
      const children = originalChildren.get(el);
      el.removeAttribute('data-curratio');
      el.removeAttribute('data-curratio-amount');
      el.removeAttribute('data-curratio-currency');
      const title = el.getAttribute('data-curratio-title');
      if (title !== null) el.setAttribute('title', title);
      else el.removeAttribute('title');
      el.removeAttribute('data-curratio-title');
      if (children) {
        el.replaceChildren(...children);
        originalChildren.delete(el);
      }
    });
  });
}
