<script lang="ts">
  export let label: string;
  export let checked: boolean;
  export let onToggle: () => void;
</script>

<button class="toggle" role="switch" aria-checked={checked} on:click={onToggle}>
  <span>{label}</span>
  <span class="track" class:on={checked}><span class="knob"></span></span>
</button>

<style>
  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    width: 100%;
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-size: var(--fs-base);
    text-align: left;
  }
  .track {
    position: relative;
    flex: 0 0 auto;
    width: 34px;
    height: 18px;
    border-radius: var(--radius-pill);
    background: var(--border);
    transition: background 0.15s ease;
  }
  .track.on {
    background: var(--accent);
  }
  .knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--knob);
    box-shadow: var(--knob-shadow);
    transition: transform 0.15s ease;
  }
  .on .knob {
    transform: translateX(16px);
  }
</style>
