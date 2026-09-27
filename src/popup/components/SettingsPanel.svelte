<script lang="ts">
  import { currencyName } from '../../lib/currencies';
  import { EChangeFormat, EModal, EPickerTarget, ETheme } from '../../lib/enums';
  import type { RefreshInterval, Settings } from '../../lib/types';
  import { currentVersion } from '../../state/changelogSeen';
  import { stores } from '../stores';
  import { modal, pickCurrency } from '../ui';
  import CardLink from './CardLink.svelte';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';
  import Segmented from './Segmented.svelte';
  import Toggle from './Toggle.svelte';

  export let onClose: () => void;

  const { settings } = stores;

  const INTERVALS: { label: string; value: RefreshInterval }[] = [
    { label: '1m', value: 1 },
    { label: '2m', value: 2 },
    { label: '3m', value: 3 },
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

  <h3 class="caps">Refresh rates every</h3>
  <Segmented options={INTERVALS} value={s.intervalMin} onPick={(v) => patch({ intervalMin: v })} />
  <p class="note">Rates update in the background, even when the popup is closed.</p>

  <h3 class="caps">Display</h3>
  <div class="stack">
    <Toggle
      label="Show daily change in pips"
      checked={s.changeFormat === EChangeFormat.Pips}
      onToggle={() =>
        patch({
          changeFormat:
            s.changeFormat === EChangeFormat.Pips ? EChangeFormat.Percent : EChangeFormat.Pips,
        })}
    />
    <Toggle
      label="Dark mode"
      checked={s.theme !== ETheme.Light}
      onToggle={() => patch({ theme: s.theme === ETheme.Light ? ETheme.Dark : ETheme.Light })}
    />
  </div>

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

  <h3 class="caps">About</h3>
  <div class="cards">
    <CardLink
      icon="info"
      eyebrow="Curratio"
      label={`v${currentVersion()}`}
      onClick={() => modal.set(EModal.About)}
    />
    <CardLink
      icon="file"
      eyebrow="What's new"
      label="Changelog"
      onClick={() => modal.set(EModal.Changelog)}
    />
  </div>
</Modal>

<style>
  h3 {
    margin: var(--space-6) 0 var(--space-2);
  }
  h3:first-of-type {
    margin-top: var(--space-5);
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
  .cards {
    display: flex;
    gap: var(--space-3);
  }
</style>
