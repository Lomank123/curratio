<script lang="ts">
  import { onMount } from 'svelte';
  import { CHANGELOG } from '../../changelog';
  import { EModal } from '../../lib/enums';
  import { markVersionSeen } from '../../state/changelogSeen';
  import { modal } from '../ui';
  import Modal from './Modal.svelte';

  export let onClose: () => void;

  onMount(() => void markVersionSeen());
</script>

<Modal title="Changelog" icon="file" {onClose} onBack={() => modal.set(EModal.Settings)}>
  <div class="entries">
    {#each CHANGELOG as entry, i (entry.version)}
      <section class:latest={i === 0}>
        <div class="head">
          <h3>v{entry.version}</h3>
          {#if i === 0}<span class="pill">Latest</span>{/if}
        </div>
        <ul>
          {#each entry.items as item (item)}<li>{item}</li>{/each}
        </ul>
      </section>
    {/each}
  </div>
</Modal>

<style>
  .entries {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  section.latest {
    padding: var(--space-4);
    border: 1px solid var(--accent);
    border-radius: var(--radius);
    background: var(--accent-soft);
  }
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  h3 {
    margin: 0;
    font-size: var(--fs-md);
    color: var(--accent);
  }
  .pill {
    font-size: var(--fs-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--accent);
    background: var(--bg);
    border: 1px solid var(--accent);
    border-radius: var(--radius-pill);
    padding: 1px var(--space-3);
  }
  ul {
    margin: 0;
    padding-left: var(--space-8);
    font-size: var(--fs-md);
    line-height: 1.45;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
</style>
