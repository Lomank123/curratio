<script lang="ts">
  import type { IconName } from './Icon.svelte';
  import Icon from './Icon.svelte';

  export let icon: IconName;
  export let eyebrow: string;
  export let label: string;
  /** External link; otherwise `onClick` is used and a chevron is shown. */
  export let href: string | null = null;
  export let onClick: (() => void) | null = null;
</script>

{#if href}
  <a class="card" {href} target="_blank" rel="noopener noreferrer">
    <Icon name={icon} size={15} class="muted" />
    <span class="text"><span class="eyebrow">{eyebrow}</span><span>{label}</span></span>
    <Icon name="external" size={13} class="muted" />
  </a>
{:else}
  <button class="card" on:click={() => onClick?.()}>
    <Icon name={icon} size={15} class="muted" />
    <span class="text"><span class="eyebrow">{eyebrow}</span><span>{label}</span></span>
    <Icon name="chevronRight" size={13} stroke={2.5} class="muted" />
  </button>
{/if}

<style>
  .card {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
    text-decoration: none;
    text-align: left;
    font-size: var(--fs-md);
    font-weight: 500;
  }
  .card:hover {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .eyebrow {
    font-size: var(--fs-xs);
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
</style>
