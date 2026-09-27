<script lang="ts">
  import { EMessageType, EModal, ESection } from '../../lib/enums';
  import type { Pair } from '../../lib/types';
  import { suggestedPairs } from '../../state/pairs';
  import { stores } from '../stores';
  import { modal } from '../ui';
  import PairSection from './PairSection.svelte';

  export let onOpen: (pair: Pair) => void;

  const { pairs, settings, rates } = stores;

  $: starred = $pairs.filter((p) => p.starred);
  $: tracking = $pairs.filter((p) => !p.starred);
  $: suggested = suggestedPairs($settings.primary, $pairs);

  let retrying = false;
  async function retry() {
    retrying = true;
    try {
      await chrome.runtime.sendMessage({ type: EMessageType.Refresh });
    } finally {
      retrying = false;
    }
  }
</script>

<div class="list">
  {#if !$rates}
    <div class="empty-box offline">
      <span class="spacer">{retrying ? 'Loading rates…' : "Couldn't load rates."}</span>
      <button class="link-btn" on:click={retry} disabled={retrying}>Retry</button>
    </div>
  {/if}
  <PairSection
    section={ESection.Featured}
    label="Featured"
    hint="Daily change"
    rows={starred}
    emptyText="Star a pair to pin it here."
    reorderable
    {onOpen}
  />
  <PairSection
    section={ESection.Tracking}
    label="Tracking"
    rows={tracking}
    emptyText="No other pairs tracked."
    {onOpen}
  />
  {#if $settings.showSuggested && suggested.length}
    <PairSection
      section={ESection.Suggested}
      label="Suggested"
      hint={`for ${$settings.primary}`}
      rows={suggested}
      suggested
      {onOpen}
    />
  {/if}
  <div class="foot">
    <button class="dashed-btn" on:click={() => modal.set(EModal.Add)}>+ track pair</button>
  </div>
</div>

<style>
  .list {
    max-height: var(--list-max-h);
    overflow-y: auto;
  }
  .offline {
    display: flex;
    align-items: center;
    margin: var(--space-4);
  }
  .foot {
    padding: var(--space-4);
  }
</style>
