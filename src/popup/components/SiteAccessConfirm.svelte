<script lang="ts">
  import { ALL_SITES, hostOf, requestSiteAccess } from '../../state/siteAccess';
  import type { AccessPromptRequest } from '../ui';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';

  export let request: AccessPromptRequest;
  export let onDone: () => void;

  $: allSites = request.pattern === ALL_SITES;
  $: where = allSites ? 'all websites' : hostOf(request.pattern);
  const POINTS = [
    'Reads only the text you select, or the visible prices when page conversion is on.',
    'Everything happens in your browser. Nothing you browse is stored or sent anywhere.',
    'You can revoke access any time in Settings.',
  ];

  let requesting = false;

  function cancel() {
    request.resolve(false);
    onDone();
  }

  // chrome.permissions.request must run inside this click (a user gesture).
  async function allow() {
    requesting = true;
    let granted = false;
    try {
      granted = await requestSiteAccess(request.pattern);
    } catch (e) {
      console.warn('[curratio] site access request failed', e);
    }
    request.resolve(granted);
    onDone();
  }
</script>

<Modal title={`Allow on ${where}`} icon="globe" onClose={cancel} layer="picker">
  <p class="lead">
    To convert prices on {allSites ? 'the pages you visit' : where}, Curratio needs access to
    {allSites ? 'all websites' : 'this site'}. Chrome will ask you to confirm next.
  </p>
  <ul>
    {#each POINTS as point (point)}
      <li>
        <Icon name="check" size={14} stroke={2.5} class="tick" />
        <span>{point}</span>
      </li>
    {/each}
  </ul>
  <div class="actions">
    <button class="btn" on:click={cancel}>Cancel</button>
    <button class="btn btn-primary" on:click={allow} disabled={requesting}>Continue</button>
  </div>
</Modal>

<style>
  .lead {
    margin: 0;
    font-size: var(--fs-base);
    line-height: 1.45;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: var(--space-5) 0 0;
    padding: var(--space-4);
    list-style: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }
  li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    font-size: var(--fs-md);
    line-height: 1.4;
    color: var(--text-muted);
  }
  li :global(.tick) {
    flex: 0 0 auto;
    margin-top: var(--space-1);
    color: var(--accent);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-5);
  }
</style>
