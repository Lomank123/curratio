<script lang="ts">
  import { onDestroy } from 'svelte';
  import { EMessageType, EModal, ERefreshError } from '../../lib/enums';
  import { formatAge } from '../../lib/format';
  import { stores } from '../stores';
  import { modal } from '../ui';
  import Icon from './Icon.svelte';
  import MoreMenu from './MoreMenu.svelte';

  const { rates, status, ui } = stores;

  const ERROR_MESSAGE: Record<ERefreshError, string> = {
    [ERefreshError.Network]: "Couldn't reach the rate service. Showing the last known rates.",
    [ERefreshError.BadResponse]: 'The rate service sent an unexpected response.',
  };

  const brandIconUrl = chrome.runtime.getURL('icon-128.png');

  let refreshing = false;
  let spin = 0;
  let now = Date.now();
  const tick = setInterval(() => (now = Date.now()), 15_000);
  onDestroy(() => clearInterval(tick));

  $: error = $status?.error ?? null;
  $: age = $rates ? formatAge(now - $rates.fetchedAt) : '—';
  $: statusText = refreshing ? 'Updating…' : error ? `Offline · ${age}` : age;
  $: statusTitle = error ? ERROR_MESSAGE[error] : 'Refresh now';

  export async function refreshNow() {
    if (refreshing) return;
    refreshing = true;
    spin += 1;
    try {
      await chrome.runtime.sendMessage({ type: EMessageType.Refresh });
    } finally {
      refreshing = false;
      now = Date.now();
    }
  }

  function toggleCalc() {
    ui.update((u) => ({ ...u, calcOpen: !u.calcOpen }));
  }
</script>

<header>
  <button class="brand" on:click={() => modal.set(EModal.About)} title="About Curratio">
    <img src={brandIconUrl} alt="" />
    Curratio
  </button>
  <span class="spacer"></span>
  <button class="status" class:error on:click={refreshNow} title={statusTitle}>
    {#key spin}
      <span class="spin-wrap" class:spinning={spin > 0}>
        <Icon name="refresh" size={13} stroke={2.25} />
      </span>
    {/key}
    <span class="num">{statusText}</span>
  </button>
  <button class="icon-btn" on:click={toggleCalc} title="Calculator" aria-label="Toggle calculator">
    <Icon name="calc" />
  </button>
  <button
    class="icon-btn"
    on:click={() => modal.set(EModal.Add)}
    title="Add pair"
    aria-label="Add pair"
  >
    <Icon name="plus" />
  </button>
  <span class="divider"></span>
  <MoreMenu />
</header>

<style>
  header {
    padding: var(--space-4);
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    font-weight: 600;
    font-size: var(--fs-base);
    padding: 0 var(--space-2) 0 0;
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text);
  }
  .brand:hover {
    color: var(--accent);
  }
  /* Same size as the toolbar buttons next to it. */
  .brand img {
    display: block;
    width: var(--control);
    height: var(--control);
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-btn-y);
    height: var(--control);
    padding: 0 var(--space-4);
    font-size: var(--fs-sm);
    color: var(--text-muted);
    border: 1px solid var(--border);
    background: var(--bg);
    border-radius: var(--radius);
  }
  .status:hover {
    background: var(--surface);
    border-color: var(--accent);
    color: var(--text);
  }
  .status.error {
    color: var(--danger);
  }
  .spin-wrap {
    display: inline-flex;
  }
  .spinning {
    animation: spin 0.5s ease;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .divider {
    width: 1px;
    height: 18px;
    margin: 0 var(--space-1);
    background: var(--border);
  }
</style>
