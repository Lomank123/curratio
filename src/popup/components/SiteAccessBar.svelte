<script lang="ts">
  import { hostOf } from '../../state/siteAccess';
  import { siteAccess } from '../siteAccess';
  import { stores } from '../stores';
  import { confirmSiteAccess } from '../ui';
  import Icon from './Icon.svelte';

  const { settings, ui } = stores;

  $: a = $siteAccess;
  $: origin = a.currentOrigin;
  $: hidden = !!origin && ($ui.hiddenAccessOrigins ?? []).includes(origin);
  $: wanted = $settings.selectionConvert || $settings.pageConvert;
  $: show = a.loaded && !!origin && !a.currentGranted && wanted && !hidden;

  function allow() {
    if (origin) void confirmSiteAccess(origin);
  }

  function dismiss() {
    if (!origin) return;
    const current = origin;
    ui.update((u) => ({
      ...u,
      hiddenAccessOrigins: [...(u.hiddenAccessOrigins ?? []), current],
    }));
  }
</script>

{#if show && origin}
  <div class="bar">
    <Icon name="globe" size={14} class="muted" />
    <span class="spacer">Convert prices on <strong>{hostOf(origin)}</strong>?</span>
    <button class="link-btn" on:click={allow}>Allow</button>
    <button
      class="ghost-btn"
      on:click={dismiss}
      title="Don't ask for this site"
      aria-label="Dismiss"
    >
      ✕
    </button>
  </div>
{/if}

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4) var(--space-3) var(--space-5);
    border-bottom: 1px solid var(--border);
    background: var(--accent-soft);
    font-size: var(--fs-md);
    color: var(--text-muted);
  }
  strong {
    color: var(--text);
    font-weight: 600;
  }
  .link-btn {
    font-size: var(--fs-md);
    font-weight: 600;
  }
</style>
