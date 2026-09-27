<script lang="ts">
  import { onMount } from 'svelte';
  import { EMessageType, EModal, ETheme } from '../lib/enums';
  import type { Pair } from '../lib/types';
  import AboutPanel from './components/AboutPanel.svelte';
  import AddPairModal from './components/AddPairModal.svelte';
  import ChangelogPanel from './components/ChangelogPanel.svelte';
  import Converter from './components/Converter.svelte';
  import CurrencyPicker from './components/CurrencyPicker.svelte';
  import PairList from './components/PairList.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import TopBar from './components/TopBar.svelte';
  import { stores } from './stores';
  import { modal, picker, type PickResult } from './ui';

  const { settings, ui, rates } = stores;

  /** Popup min-height per overlay, so the overlay has room (see app.css). */
  const OVERLAY_SIZE: Record<EModal, string> = {
    [EModal.Add]: 'compact',
    [EModal.About]: 'compact',
    [EModal.Settings]: 'tall',
    [EModal.Changelog]: 'tall',
  };

  $: document.documentElement.setAttribute('data-theme', $settings.theme ?? ETheme.Dark);
  $: overlay = $modal ? OVERLAY_SIZE[$modal] : $picker ? 'picker' : null;
  $: if (overlay) document.body.setAttribute('data-overlay', overlay);
  else document.body.removeAttribute('data-overlay');

  onMount(() => {
    const stale = !$rates || Date.now() - $rates.fetchedAt > $settings.intervalMin * 60_000;
    if (stale) void chrome.runtime.sendMessage({ type: EMessageType.Refresh });
  });

  function closeModal() {
    modal.set(null);
  }

  function finishPick(result: PickResult | null) {
    $picker?.resolve(result);
    picker.set(null);
  }

  /** Row click: load the pair into the converter (the v1 stand-in for the chart). */
  function openPair(pair: Pair) {
    ui.update((u) => ({
      ...u,
      calcOpen: true,
      calc: { ...u.calc, from: pair.base, to: pair.quote },
    }));
  }

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Escape') return;
    if ($picker) finishPick(null);
    else if ($modal) closeModal();
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }
</script>

<svelte:window on:keydown|capture={onKey} />

<main>
  <TopBar />
  {#if $ui.calcOpen}<Converter />{/if}
  <PairList onOpen={openPair} />

  {#if $modal === EModal.Add}
    <AddPairModal onClose={closeModal} />
  {:else if $modal === EModal.Settings}
    <SettingsPanel onClose={closeModal} />
  {:else if $modal === EModal.About}
    <AboutPanel onClose={closeModal} />
  {:else if $modal === EModal.Changelog}
    <ChangelogPanel onClose={closeModal} />
  {/if}

  {#if $picker}
    {#key $picker}
      <CurrencyPicker request={$picker} onDone={finishPick} />
    {/key}
  {/if}
</main>
