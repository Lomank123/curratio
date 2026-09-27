<script lang="ts">
  import type { IconName } from './Icon.svelte';
  import Icon from './Icon.svelte';

  export let title: string;
  export let icon: IconName | null = null;
  export let onClose: () => void;
  export let onBack: (() => void) | null = null;
  /** Pickers stack above other modals. */
  export let layer: 'modal' | 'picker' = 'modal';
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="overlay" class:picker={layer === 'picker'} on:click={onClose}>
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div class="panel" role="dialog" aria-label={title} on:click|stopPropagation>
    <div class="head">
      {#if onBack}
        <button class="ghost-btn back" on:click={onBack} title="Back" aria-label="Back">
          <Icon name="chevronLeft" size={14} stroke={2.5} />
        </button>
      {/if}
      <h2>
        {#if icon}<Icon name={icon} class="muted" />{/if}
        {title}
      </h2>
      <button class="ghost-btn" on:click={onClose} title="Close" aria-label="Close">✕</button>
    </div>
    <slot />
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
  .panel {
    width: var(--panel-w);
    max-height: 100%;
    overflow-y: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: var(--space-4);
    box-shadow: var(--shadow-menu);
  }
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }
  .back {
    width: 24px;
    height: 24px;
    padding: 0;
  }
  h2 {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin: 0;
    font-size: var(--fs-lg);
  }
</style>
