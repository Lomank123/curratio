<script lang="ts">
  import { currencyName } from '../../lib/currencies';
  import { EChangeFormat, EPickerTarget, ETheme } from '../../lib/enums';
  import type { RefreshSeconds, Settings } from '../../lib/types';
  import { stores } from '../stores';
  import { pickCurrency } from '../ui';
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

  $: s = $settings;
  $: pageTarget = s.pageConvertTarget ?? s.primary;

  function patch(p: Partial<Settings>) {
    settings.update((cur) => ({ ...cur, ...p }));
  }

  async function pickPrimary() {
    const res = await pickCurrency(EPickerTarget.Primary, s.primary);
    if (res?.code) patch({ primary: res.code });
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

  <h3 class="caps">Display</h3>
  <div class="stack">
    <Toggle
      label="Show suggested pairs"
      checked={s.showSuggested}
      onToggle={() => patch({ showSuggested: !s.showSuggested })}
    />
    <Toggle
      label="Show change as actual value"
      checked={s.changeFormat === EChangeFormat.Value}
      onToggle={() =>
        patch({
          changeFormat:
            s.changeFormat === EChangeFormat.Value ? EChangeFormat.Percent : EChangeFormat.Value,
        })}
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
</style>
