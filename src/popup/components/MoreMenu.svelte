<script lang="ts">
  import { onMount } from 'svelte';
  import { EModal, ETheme } from '../../lib/enums';
  import { hasUnseenChangelog } from '../../state/changelogSeen';
  import { stores } from '../stores';
  import { modal } from '../ui';
  import Icon from './Icon.svelte';

  const { settings } = stores;

  let open = false;
  let unseen = false;

  onMount(() => {
    void hasUnseenChangelog().then((v) => (unseen = v));
  });

  // Clear the dot once the changelog has been opened.
  $: if ($modal === EModal.Changelog) unseen = false;

  $: dark = $settings.theme !== ETheme.Light;

  function openModal(m: EModal) {
    modal.set(m);
    open = false;
  }

  function toggleTheme() {
    settings.update((s) => ({ ...s, theme: dark ? ETheme.Light : ETheme.Dark }));
    open = false;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      open = false;
      e.stopPropagation();
    }
  }
</script>

<svelte:window on:keydown={onKey} />

<div class="wrap">
  <button
    class="icon-btn"
    on:click={() => (open = !open)}
    title="More"
    aria-label="More"
    aria-expanded={open}
  >
    <Icon name="more" stroke={2.5} />
    {#if unseen}<span class="dot" aria-hidden="true"></span>{/if}
  </button>
  {#if open}
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="backdrop" on:click={() => (open = false)}></div>
    <div class="menu" role="menu">
      <button role="menuitem" on:click={() => openModal(EModal.Settings)}>
        <Icon name="settings" size={15} class="muted" />
        <span>Settings</span>
      </button>
      <button role="menuitem" on:click={() => openModal(EModal.Changelog)}>
        <Icon name="file" size={15} class="muted" />
        <span class="spacer">Changelog</span>
        {#if unseen}<span class="badge">New</span>{/if}
      </button>
      <button role="menuitem" on:click={() => openModal(EModal.About)}>
        <Icon name="info" size={15} class="muted" />
        <span>About</span>
      </button>
      <div class="sep"></div>
      <button role="menuitem" on:click={toggleTheme}>
        <Icon name={dark ? 'sun' : 'moon'} size={15} class="muted" />
        <span>{dark ? 'Light mode' : 'Dark mode'}</span>
      </button>
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
  }
  .icon-btn {
    position: relative;
  }
  .dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 6px;
    height: 6px;
    border-radius: var(--radius-pill);
    background: var(--accent);
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
  }
  .menu {
    position: absolute;
    top: calc(100% + var(--space-3));
    right: 0;
    z-index: 21;
    min-width: 180px;
    padding: var(--space-2);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-menu);
  }
  .menu button {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
    padding: var(--space-row-y) var(--space-4);
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text);
    font-size: var(--fs-md);
    text-align: left;
  }
  .menu button:hover {
    background: var(--surface);
  }
  .sep {
    height: 1px;
    margin: var(--space-2) 0;
    background: var(--border);
  }
  .badge {
    font-size: var(--fs-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid var(--accent);
    border-radius: var(--radius-pill);
    padding: 0 var(--space-3);
  }
</style>
