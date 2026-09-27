<script lang="ts">
  import { currencyName } from '../../lib/currencies';
  import { formatRate } from '../../lib/format';
  import { crossRate, dailyChange } from '../../lib/rates';
  import type { Pair } from '../../lib/types';
  import { removePair, toggleStar, addPair } from '../../state/pairs';
  import { stores } from '../stores';
  import Icon from './Icon.svelte';

  export let pair: Pair;
  /** Suggested rows get a single "+ Track" button instead of star/remove. */
  export let suggested = false;
  export let onOpen: (pair: Pair) => void;

  const { rates, prevDay, pairs, settings } = stores;

  $: rate = crossRate($rates?.rates, pair.base, pair.quote);
  $: prev = crossRate($prevDay?.rates, pair.base, pair.quote);
  $: change = dailyChange(rate, prev, $settings.changeFormat);

  function star(e: MouseEvent) {
    e.stopPropagation();
    pairs.update((p) => toggleStar(p, pair.base, pair.quote));
  }
  function remove(e: MouseEvent) {
    e.stopPropagation();
    pairs.update((p) => removePair(p, pair.base, pair.quote));
  }
  function track(e: MouseEvent) {
    e.stopPropagation();
    pairs.update((p) => addPair(p, pair.base, pair.quote, false));
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(pair);
    }
  }
</script>

<div
  class="row"
  role="button"
  tabindex="0"
  on:click={() => onOpen(pair)}
  on:keydown={onKey}
  title={`${currencyName(pair.base)} → ${currencyName(pair.quote)} · open in converter`}
>
  {#if suggested}
    <button class="lead" on:click={track} title="Track" aria-label="Track pair">
      <Icon name="plus" size={14} stroke={2.25} />
    </button>
  {:else}
    <button
      class="lead"
      class:on={pair.starred}
      on:click={star}
      title={pair.starred ? 'Remove from Featured' : 'Add to Featured'}
      aria-label={pair.starred ? 'Remove from Featured' : 'Add to Featured'}
    >
      <Icon name="star" size={14} filled={pair.starred} />
    </button>
  {/if}
  <span class="pair">{pair.base}<span class="quote">/{pair.quote}</span></span>
  <span class="num">{formatRate(rate)}</span>
  <span class="chg num" class:up={change?.up === true} class:down={change?.up === false}>
    {change?.text ?? '—'}
  </span>
  {#if !suggested}
    <button class="remove" on:click={remove} title="Stop tracking" aria-label="Stop tracking">
      ✕
    </button>
  {/if}
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: var(--control-md);
    padding: 0 var(--space-1) 0 0;
    border-radius: var(--radius);
    cursor: pointer;
    outline: none;
  }
  .row:hover,
  .row:focus-visible {
    background: var(--surface);
  }
  .lead {
    width: var(--control);
    height: var(--control);
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: var(--radius);
  }
  .lead:hover {
    background: var(--border);
  }
  .lead.on {
    color: var(--accent);
  }
  .pair {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .quote {
    color: var(--text-muted);
    font-weight: 500;
  }
  .chg {
    flex: 0 0 auto;
    width: 66px;
    height: var(--control-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius);
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--text-muted);
    background: var(--surface);
  }
  .chg.up {
    color: var(--up);
    background: var(--up-soft);
  }
  .chg.down {
    color: var(--down);
    background: var(--down-soft);
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
</style>
