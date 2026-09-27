<script lang="ts">
  import { currencyName } from '../../lib/currencies';
  import { EChangeFormat, EPickerTarget, ETheme } from '../../lib/enums';
  import type { RefreshSeconds, Settings } from '../../lib/types';
  import { stores } from '../stores';
  import { siteAccess } from '../siteAccess';
  import { confirmSiteAccess, pickCurrency } from '../ui';
  import { ALL_SITES, hostOf, revokeSiteAccess } from '../../state/siteAccess';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';
  import Segmented from './Segmented.svelte';
  import Toggle from './Toggle.svelte';

  export let onClose: () => void;

  const { settings } = stores;

  const INTERVALS: { label: string; value: RefreshSeconds }[] = [
    { label: '30s', value: 30 },
    { label: '1m', value: 60 },
    { label: '5m', value: 300 },
    { label: '15m', value: 900 },
    { label: '1h', value: 3600 },
    { label: 'Off', value: 0 },
  ];

  const CHANGE_FORMATS: { label: string; value: EChangeFormat }[] = [
    { label: 'Percentage', value: EChangeFormat.Percent },
    { label: 'Actual value', value: EChangeFormat.Value },
  ];

  $: s = $settings;
  $: pageTarget = s.pageConvertTarget ?? s.primary;

  function patch(p: Partial<Settings>) {
    settings.update((cur) => ({ ...cur, ...p }));
  }

  async function pickPrimary() {
    const res = await pickCurrency(EPickerTarget.Primary, s.primary);
    if (res?.code) patch({ primary: res.code });
  }

  $: access = $siteAccess;
  $: canAllowCurrent =
    !!access.currentOrigin && !access.allSites && !access.origins.includes(access.currentOrigin);

  function toggleAllSites() {
    if (access.allSites) void revokeSiteAccess(ALL_SITES);
    else void confirmSiteAccess(ALL_SITES);
  }

  function allowCurrent() {
    if (access.currentOrigin) void confirmSiteAccess(access.currentOrigin);
  }

  async function pickPageTarget() {
    const res = await pickCurrency(EPickerTarget.PageTarget, s.pageConvertTarget, true);
    if (res) patch({ pageConvertTarget: res.code });
  }
</script>

<Modal title="Settings" icon="settings" {onClose}>
  <h3 class="caps">Primary currency</h3>
  <button class="row-btn" on:click={pickPrimary}>
    <span class="code">{s.primary}</span>
    <span class="spacer muted">{currencyName(s.primary)}</span>
    <Icon name="chevronDown" size={12} stroke={2.5} class="muted" />
  </button>
  <p class="note">
    Prices you select on web pages are converted into this currency, and suggested pairs are built
    around it.
  </p>

  <h3 class="caps">Refresh rates every</h3>
  <Segmented options={INTERVALS} value={s.refreshSec} onPick={(v) => patch({ refreshSec: v })} />
  <p class="note">
    {s.refreshSec
      ? 'Rates update in the background, even when the popup is closed.'
      : 'Rates update only when you click the timer in the top bar.'}
  </p>

  <h3 class="caps">Show daily change as</h3>
  <Segmented
    options={CHANGE_FORMATS}
    value={s.changeFormat}
    onPick={(v) => patch({ changeFormat: v })}
  />
  <p class="note">
    How much each pair moved since yesterday: as a share of the rate (+0.23%) or as the rate's own
    difference (1.0850 → 1.0875 shows +0.0025).
  </p>

  <h3 class="caps">Display</h3>
  <div class="stack">
    <Toggle
      label="Show suggested pairs"
      checked={s.showSuggested}
      onToggle={() => patch({ showSuggested: !s.showSuggested })}
    />
    <Toggle
      label="Dark mode"
      checked={s.theme !== ETheme.Light}
      onToggle={() => patch({ theme: s.theme === ETheme.Light ? ETheme.Dark : ETheme.Light })}
    />
  </div>
  <p class="note">
    Rates show 2 decimals from 100, 3 from 10 and 4 below that (4 significant digits for very small
    rates). Converted amounts use each currency's own decimals, e.g. 0 for JPY.
  </p>

  <h3 class="caps">On web pages</h3>
  <div class="stack">
    <Toggle
      label="Convert selected prices"
      checked={s.selectionConvert}
      onToggle={() => patch({ selectionConvert: !s.selectionConvert })}
    />
    <Toggle
      label="Convert all prices on pages"
      checked={s.pageConvert}
      onToggle={() => patch({ pageConvert: !s.pageConvert })}
    />
    {#if s.pageConvert}
      <button class="row-btn" on:click={pickPageTarget}>
        <span class="spacer">Convert to</span>
        <span class="code">
          {s.pageConvertTarget === null ? `Primary (${s.primary})` : pageTarget}
        </span>
        <Icon name="chevronDown" size={12} stroke={2.5} class="muted" />
      </button>
    {/if}
  </div>

  <h3 class="caps">Website access</h3>
  <Toggle label="Allow on all websites" checked={access.allSites} onToggle={toggleAllSites} />
  {#if !access.allSites}
    {#if access.origins.length}
      <div class="sites">
        {#each access.origins as origin (origin)}
          <div class="site">
            <Icon name="globe" size={14} class="muted" />
            <span class="spacer">{hostOf(origin)}</span>
            <button
              class="remove"
              on:click={() => revokeSiteAccess(origin)}
              title="Remove access"
              aria-label={`Remove access to ${hostOf(origin)}`}>✕</button
            >
          </div>
        {/each}
      </div>
    {/if}
    {#if canAllowCurrent && access.currentOrigin}
      <button class="dashed-btn allow" on:click={allowCurrent}>
        + Allow on {hostOf(access.currentOrigin)}
      </button>
    {/if}
  {/if}
  <p class="note">
    Prices are converted only on sites you allow. Allow the current site from the popup, or all
    websites here.
  </p>
</Modal>

<style>
  h3 {
    margin: var(--space-6) 0 var(--space-2);
  }
  h3:first-of-type {
    margin-top: 0;
  }
  .note {
    margin: var(--space-3) 0 0;
    font-size: var(--fs-md);
    color: var(--text-muted);
    line-height: 1.4;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .row-btn {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-size: var(--fs-base);
    text-align: left;
  }
  .row-btn:hover {
    border-color: var(--accent);
  }
  .code {
    font-weight: 600;
  }
  .sites {
    display: flex;
    flex-direction: column;
    margin-top: var(--space-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .site {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
    font-size: var(--fs-md);
  }
  .site + .site {
    border-top: 1px solid var(--border);
  }
  .remove {
    width: var(--control-sm);
    height: var(--control-sm);
    padding: 0;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-muted);
    border-radius: var(--radius);
    font-size: var(--fs-sm);
  }
  .remove:hover {
    border-color: var(--danger);
    color: var(--danger);
  }
  .allow {
    margin-top: var(--space-2);
  }
</style>
