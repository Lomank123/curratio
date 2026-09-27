<script lang="ts" generics="T">
  export let options: { label: string; value: T }[];
  export let value: T;
  export let onPick: (value: T) => void;
</script>

<div class="seg" role="radiogroup">
  {#each options as opt (opt.label)}
    <button
      role="radio"
      aria-checked={opt.value === value}
      class:active={opt.value === value}
      on:click={() => onPick(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style>
  .seg {
    display: flex;
    gap: var(--space-1);
    padding: var(--space-1);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  button {
    flex: 1;
    height: 24px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--fs-sm);
    font-weight: 600;
  }
  button:hover,
  button.active {
    color: var(--text);
  }
  button.active {
    background: var(--bg);
  }
</style>
