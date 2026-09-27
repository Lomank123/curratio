<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { CURRENCY_CODES, currencyName, currencySymbol } from '../../lib/currencies';
  import { EPickerTarget } from '../../lib/enums';
  import { stores } from '../stores';
  import type { PickerRequest, PickResult } from '../ui';
  import Modal from './Modal.svelte';
  import Icon from './Icon.svelte';

  export let request: PickerRequest;
  export let onDone: (result: PickResult | null) => void;

  const { rates, pairs, settings } = stores;

  const TITLE: Record<EPickerTarget, string> = {
    [EPickerTarget.CalcFrom]: 'Convert from',
    [EPickerTarget.CalcTo]: 'Convert to',
    [EPickerTarget.AddFrom]: 'Base currency',
    [EPickerTarget.AddTo]: 'Quote currency',
    [EPickerTarget.Primary]: 'Primary currency',
    [EPickerTarget.PageTarget]: 'Convert page prices to',
  };

  type Item = { code: string | null; label: string; name: string; selected: boolean };

  let query = '';
  let active = 0;
  let input: HTMLInputElement;
  let listEl: HTMLDivElement;

  // Only list codes we have rates for (all table codes before the first fetch).
  $: available = $rates ? CURRENCY_CODES.filter((c) => c in $rates.rates) : CURRENCY_CODES;
  $: pinned = new Set([$settings.primary, ...$pairs.flatMap((p) => [p.base, p.quote])]);
  $: q = query.trim().toLowerCase();
  $: codes = q
    ? available.filter(
        (c) =>
          c.toLowerCase().includes(q) ||
          currencyName(c).toLowerCase().includes(q) ||
          currencySymbol(c).toLowerCase() === q,
      )
    : [...available.filter((c) => pinned.has(c)), ...available.filter((c) => !pinned.has(c))];
  $: items = [
    ...(request.allowPrimary && !q
      ? [
          {
            code: null,
            label: 'Primary',
            name: `Use primary (${$settings.primary})`,
            selected: request.selected === null,
          },
        ]
      : []),
    ...codes.map((c) => ({
      code: c,
      label: c,
      name: currencyName(c),
      selected: c === request.selected,
    })),
  ] as Item[];
  $: if (active >= items.length) active = Math.max(0, items.length - 1);

  function onQuery() {
    active = 0;
  }

  async function scrollActive() {
    await tick();
    listEl
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      active = Math.min(items.length - 1, Math.max(0, active + step));
      void scrollActive();
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      onDone({ code: items[active].code });
    }
  }

  onMount(async () => {
    input.focus();
    const idx = items.findIndex((i) => i.selected);
    if (idx >= 0) active = idx;
    await scrollActive();
  });
</script>

<Modal title={TITLE[request.target]} onClose={() => onDone(null)} layer="picker">
  <div class="search">
    <Icon name="search" size={14} class="muted" />
    <input
      bind:this={input}
      bind:value={query}
      on:input={onQuery}
      on:keydown={onKey}
      placeholder="Search code or name"
      aria-label="Search currencies"
    />
  </div>
  <div class="list" bind:this={listEl} role="listbox">
    {#each items as item, i (item.code ?? '__primary')}
      <button
        role="option"
        aria-selected={item.selected}
        class:selected={item.selected}
        class:active={i === active}
        data-active={i === active}
        on:click={() => onDone({ code: item.code })}
        on:mousemove={() => (active = i)}
      >
        <span class="code">{item.label}</span>
        <span class="name">{item.name}</span>
        {#if item.selected}<Icon name="check" size={14} stroke={2.5} class="check" />{/if}
      </button>
    {/each}
    {#if items.length === 0}
      <div class="empty-box">No currencies match “{query}”.</div>
    {/if}
  </div>
</Modal>

<style>
  .search {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: var(--control-md);
    padding: 0 var(--space-4);
    border-radius: var(--radius);
    background: var(--surface);
  }
  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--text);
    caret-color: var(--accent);
    font-size: var(--fs-base);
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    max-height: 230px;
    overflow-y: auto;
    margin-top: var(--space-3);
  }
  .list button {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
    flex: 0 0 auto;
    height: var(--control-md);
    padding: 0 var(--space-4);
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text);
    font-size: var(--fs-base);
    text-align: left;
  }
  .list button.active {
    background: var(--surface);
  }
  .list button.selected {
    background: var(--accent-soft);
  }
  .code {
    min-width: 36px;
    font-weight: 600;
  }
  .name {
    flex: 1;
    min-width: 0;
    color: var(--text-muted);
    font-size: var(--fs-md);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .list :global(.check) {
    color: var(--accent);
  }
</style>
