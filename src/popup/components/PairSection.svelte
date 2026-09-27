<script lang="ts">
  import type { ESection } from '../../lib/enums';
  import type { Pair } from '../../lib/types';
  import { stores } from '../stores';
  import Icon from './Icon.svelte';
  import PairRow from './PairRow.svelte';

  export let section: ESection;
  export let label: string;
  export let rows: Pair[];
  export let hint = '';
  export let emptyText = '';
  export let suggested = false;
  export let onOpen: (pair: Pair) => void;

  const { ui } = stores;

  $: collapsed = $ui.collapsed[section];

  function toggle() {
    ui.update((u) => ({ ...u, collapsed: { ...u.collapsed, [section]: !collapsed } }));
  }
</script>

<section>
  <button class="head caps" class:open={!collapsed} on:click={toggle} aria-expanded={!collapsed}>
    <span class="chevron" class:collapsed><Icon name="chevronDown" size={14} stroke={2.5} /></span>
    <span>{label} ({rows.length})</span>
    <span class="spacer"></span>
    {#if hint}<span class="hint">{hint}</span>{/if}
  </button>
  {#if !collapsed}
    {#each rows as pair (pair.base + pair.quote)}
      <PairRow {pair} {suggested} {onOpen} />
    {/each}
    {#if rows.length === 0 && emptyText}
      <div class="empty-box">{emptyText}</div>
    {/if}
  {/if}
</section>

<style>
  section {
    padding: var(--space-row-y) var(--space-4);
    border-bottom: 1px solid var(--border);
  }
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    min-height: 28px;
    margin: 0;
    padding: 0 var(--space-3);
    border: none;
    border-radius: var(--radius);
    background: transparent;
  }
  .head.open {
    margin-bottom: var(--space-2);
  }
  .head:hover {
    background: var(--surface);
    color: var(--text);
  }
  .chevron {
    display: inline-flex;
    transition: transform 0.15s ease;
  }
  .chevron.collapsed {
    transform: rotate(-90deg);
  }
  .hint {
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
  }
</style>
