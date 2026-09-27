<script lang="ts">
  import { currencyName } from '../../lib/currencies';
  import { EPickerTarget } from '../../lib/enums';
  import { formatRate } from '../../lib/format';
  import { crossRate, dailyChange } from '../../lib/rates';
  import { counterpart } from '../../state/defaults';
  import { addPair, findPair } from '../../state/pairs';
  import { stores } from '../stores';
  import { pickCurrency } from '../ui';
  import Icon from './Icon.svelte';
  import Modal from './Modal.svelte';

  export let onClose: () => void;

  const { settings, pairs, rates, prevDay } = stores;

  let base = counterpart($settings.primary);
  let quote = $settings.primary;
  let star = false;

  $: same = base === quote;
  $: exists = !!findPair($pairs, base, quote);
  $: rate = crossRate($rates?.rates, base, quote);
  $: change = dailyChange(rate, crossRate($prevDay?.rates, base, quote), $settings.changeFormat);
  $: preview = same ? 'Pick two different currencies' : `1 ${base} = ${formatRate(rate)} ${quote}`;
  $: disabled = same || exists;

  async function pickBase() {
    const res = await pickCurrency(EPickerTarget.AddFrom, base);
    if (res?.code) base = res.code;
  }
  async function pickQuote() {
    const res = await pickCurrency(EPickerTarget.AddTo, quote);
    if (res?.code) quote = res.code;
  }
  function swap() {
    [base, quote] = [quote, base];
  }
  function confirm() {
    if (disabled) return;
    pairs.update((p) => addPair(p, base, quote, star));
    onClose();
  }
</script>

<Modal title="Track a pair" {onClose}>
  <div class="pick">
    <div class="field">
      <span class="caps">Base</span>
      <button class="cur" on:click={pickBase}>
        <span>{base}</span>
        <span class="name">{currencyName(base)}</span>
        <Icon name="chevronDown" size={12} stroke={2.5} class="muted" />
      </button>
    </div>
    <button class="icon-btn swap" on:click={swap} title="Swap" aria-label="Swap">
      <Icon name="swapHorizontal" size={14} />
    </button>
    <div class="field">
      <span class="caps">Quote</span>
      <button class="cur" on:click={pickQuote}>
        <span>{quote}</span>
        <span class="name">{currencyName(quote)}</span>
        <Icon name="chevronDown" size={12} stroke={2.5} class="muted" />
      </button>
    </div>
  </div>
  <div class="preview">
    <span class="spacer muted num">{preview}</span>
    {#if !same && change}
      <span class="chg num" class:up={change.up} class:down={!change.up}>{change.text}</span>
    {/if}
  </div>
  <label class="check">
    <input type="checkbox" bind:checked={star} />
    <span>Add to Featured</span>
  </label>
  <div class="actions">
    <button class="btn" on:click={onClose}>Cancel</button>
    <button class="btn btn-primary" on:click={confirm} {disabled}>
      {exists ? 'Already tracked' : 'Add pair'}
    </button>
  </div>
</Modal>

<style>
  .pick {
    display: flex;
    align-items: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-5);
  }
  .field {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .cur {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: var(--control-md);
    padding: 0 var(--space-4);
    border: none;
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-size: var(--fs-base);
    font-weight: 600;
    text-align: left;
  }
  .cur:hover {
    background: var(--border);
  }
  .name {
    flex: 1;
    min-width: 0;
    font-size: var(--fs-sm);
    font-weight: 400;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .swap {
    width: var(--control-md);
    height: var(--control-md);
    flex: 0 0 auto;
  }
  .preview {
    margin-top: var(--space-4);
    padding: var(--space-4);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    display: flex;
    align-items: center;
    gap: var(--space-4);
    font-size: var(--fs-md);
  }
  .chg {
    font-weight: 600;
  }
  .chg.up {
    color: var(--up);
  }
  .chg.down {
    color: var(--down);
  }
  .check {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-top: var(--space-4);
    font-size: var(--fs-md);
    cursor: pointer;
  }
  .check input {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: var(--accent);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-5);
  }
</style>
