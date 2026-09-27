<script lang="ts">
  import type { IconName } from './Icon.svelte';
  import Icon from './Icon.svelte';

  export let title: string;
  export let icon: IconName | null = null;
  export let onClose: () => void;
  /** Pickers stack above other modals. */
  export let layer: 'modal' | 'picker' = 'modal';
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="overlay" class:picker={layer === 'picker'} on:click={onClose}>
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div class="panel" role="dialog" aria-label={title} on:click|stopPropagation>
    <div class="head">
      <h2>
        {#if icon}<Icon name={icon} class="muted" />{/if}
        {title}
      </h2>
      <button class="ghost-btn" on:click={onClose} title="Close" aria-label="Close">✕</button>
    </div>
    <div class="body">
      <slot />
    </div>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    padding: var(--space-6) 0;
    background: var(--backdrop);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
  .overlay.picker {
    z-index: 30;
  }
  /* The header stays put; only the body scrolls. The body owns the right padding so the
     scrollbar (overlay or classic) sits in that gutter instead of on top of the content. */
  .panel {
    width: var(--panel-w);
    max-height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: var(--space-4) 0 var(--space-4) var(--space-4);
    box-shadow: var(--shadow-menu);
  }
  .head {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
    padding-right: var(--space-4);
  }
  h2 {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin: 0;
    font-size: var(--fs-lg);
  }
  .body {
    min-height: 0;
    overflow-y: auto;
    padding-right: var(--space-4);
  }
</style>
