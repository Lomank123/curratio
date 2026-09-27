import { ETheme } from '../lib/enums';
import tokensCss from '../popup/styles/tokens.css?inline';
import contentCss from './content.css?inline';

const HOST_TAG = 'curratio-root';

let hostEl: HTMLElement | null = null;
let shadow: ShadowRoot | null = null;

/** The shared Shadow-DOM host for our content-script UI, created lazily on first use. */
export function getHost(): ShadowRoot {
  if (shadow) return shadow;
  hostEl = document.createElement(HOST_TAG);
  document.documentElement.appendChild(hostEl);
  shadow = hostEl.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `${tokensCss}\n${contentCss}`;
  shadow.appendChild(style);
  return shadow;
}

/** Apply the theme to the host, falling back to the OS preference when unset. */
export function setHostTheme(theme: ETheme | null): void {
  getHost();
  const resolved =
    theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? ETheme.Dark : ETheme.Light);
  hostEl?.setAttribute('data-theme', resolved);
}

/** True when `node` is our host element or lives inside its shadow tree. */
export function isInsideHost(node: Node | null): boolean {
  return !!hostEl && !!node && (node === hostEl || hostEl.contains(node));
}
