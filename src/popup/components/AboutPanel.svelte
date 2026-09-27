<script lang="ts">
  import { currentVersion } from '../../state/changelogSeen';
  import CardLink from './CardLink.svelte';
  import Modal from './Modal.svelte';

  export let onClose: () => void;

  const iconUrl = chrome.runtime.getURL('icon-128.png');
</script>

<Modal title="About" icon="info" {onClose}>
  <div class="hero">
    <img src={iconUrl} alt="" width="48" height="48" />
    <div class="title">
      <span class="name">Curratio</span>
      <span class="pill">v{currentVersion()}</span>
    </div>
    <p>Open source, lightweight &amp; free exchange-rate tracker and converter.</p>
  </div>
  <div class="cards">
    <CardLink icon="user" eyebrow="Creator" label="Lomank" href="https://lomank.com" />
    <CardLink
      icon="github"
      eyebrow="Source code"
      label="GitHub"
      href="https://github.com/Lomank123/curratio"
    />
  </div>
</Modal>

<style>
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--space-8) var(--space-6);
    margin-bottom: var(--space-5);
    border-radius: var(--radius);
    background: var(--surface);
    border: 1px solid var(--border);
  }
  img {
    display: block;
    margin-bottom: var(--space-5);
  }
  .title {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
  }
  .name {
    font-size: var(--fs-xl);
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .pill {
    font-size: var(--fs-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid var(--accent);
    border-radius: var(--radius-pill);
    padding: 1px var(--space-3);
  }
  p {
    margin: 0;
    max-width: 240px;
    font-size: var(--fs-md);
    color: var(--text-muted);
    line-height: 1.45;
  }
  .cards {
    display: flex;
    gap: var(--space-3);
  }
</style>
