<script lang="ts">
  import type { ESection } from '../../lib/enums';
  import type { Pair } from '../../lib/types';
  import { moveFeatured } from '../../state/pairs';
  import { stores } from '../stores';
  import Icon from './Icon.svelte';
  import PairRow from './PairRow.svelte';

  export let section: ESection;
  export let label: string;
  export let rows: Pair[];
  export let hint = '';
  export let emptyText = '';
  export let suggested = false;
  /** Rows can be dragged to reorder (Featured). */
  export let reorderable = false;
  export let onOpen: (pair: Pair) => void;

  const { ui, pairs } = stores;

  let dragged: Pair | null = null;
  let dropTarget: Pair | null = null;
  let dropAfter = false;

  const keyOf = (p: Pair) => p.base + p.quote;

  function onDragStart(e: DragEvent, pair: Pair) {
    dragged = pair;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', keyOf(pair));
    }
  }

  function onDragOver(e: DragEvent, pair: Pair) {
    if (!dragged) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dropTarget = pair;
    dropAfter = e.clientY > rect.top + rect.height / 2;
  }

  function onDrop(e: DragEvent, pair: Pair) {
    e.preventDefault();
    if (dragged) {
      const from = dragged;
      pairs.update((p) => moveFeatured(p, from, pair, dropAfter));
    }
    resetDrag();
  }

  function resetDrag() {
    dragged = null;
    dropTarget = null;
  }

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
    {#each rows as pair (keyOf(pair))}
      {#if reorderable}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="drag-item"
          draggable="true"
          class:dragging={dragged && keyOf(dragged) === keyOf(pair)}
          class:drop-before={dropTarget && keyOf(dropTarget) === keyOf(pair) && !dropAfter}
          class:drop-after={dropTarget && keyOf(dropTarget) === keyOf(pair) && dropAfter}
          on:dragstart={(e) => onDragStart(e, pair)}
          on:dragover={(e) => onDragOver(e, pair)}
          on:drop={(e) => onDrop(e, pair)}
          on:dragend={resetDrag}
        >
          <PairRow {pair} {suggested} {onOpen} />
        </div>
      {:else}
        <PairRow {pair} {suggested} {onOpen} />
      {/if}
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
  .drag-item {
    border-radius: var(--radius);
  }
  .drag-item :global(.row) {
    cursor: grab;
  }
  .drag-item.dragging {
    opacity: 0.4;
  }
  .drag-item.drop-before {
    box-shadow: inset 0 2px 0 var(--accent);
  }
  .drag-item.drop-after {
    box-shadow: inset 0 -2px 0 var(--accent);
  }
  .hint {
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
  }
</style>
