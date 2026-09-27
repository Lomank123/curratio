<script lang="ts">
  import { currencyName } from '../../lib/currencies';
  import { ECalcSide, EPickerTarget } from '../../lib/enums';
  import { formatAmount, formatRate, parseTypedAmount } from '../../lib/format';
  import { crossRate } from '../../lib/rates';
  import { addPair, findPair } from '../../state/pairs';
  import { stores } from '../stores';
  import { pickCurrency } from '../ui';
  import Icon from './Icon.svelte';

  const { ui, rates, pairs } = stores;

  let copied = false;
  let copyTimer: ReturnType<typeof setTimeout>;

  $: calc = $ui.calc;
  $: rate = crossRate($rates?.rates, calc.from, calc.to);
  $: disabled = rate === null;
  $: typed = parseTypedAmount(calc.amount);
  $: isFrom = calc.side === ECalcSide.From;
  $: computed =
    rate === null
      ? ''
      : isFrom
        ? formatAmount(typed * rate, calc.to)
        : formatAmount(typed / rate, calc.from);
  $: fromVal = isFrom ? calc.amount : computed;
  $: toVal = isFrom ? computed : calc.amount;
  $: unit = rate === null ? 'Rate unavailable' : `1 ${calc.from} = ${formatRate(rate)} ${calc.to}`;
  $: canTrack = calc.from !== calc.to && !findPair($pairs, calc.from, calc.to);

  function setCalc(patch: Partial<typeof calc>) {
    ui.update((u) => ({ ...u, calc: { ...u.calc, ...patch } }));
  }

  function onInput(side: ECalcSide, e: Event) {
    setCalc({ amount: (e.target as HTMLInputElement).value, side });
  }

  async function pick(side: ECalcSide) {
    const target = side === ECalcSide.From ? EPickerTarget.CalcFrom : EPickerTarget.CalcTo;
    const res = await pickCurrency(target, calc[side]);
    if (res?.code) setCalc({ [side]: res.code });
  }

  function swap() {
    setCalc({ from: calc.to, to: calc.from });
  }

  function track() {
    pairs.update((p) => addPair(p, calc.from, calc.to, false));
  }

  async function copy() {
    const value = isFrom ? toVal : fromVal;
    const code = isFrom ? calc.to : calc.from;
    try {
      await navigator.clipboard.writeText(`${value} ${code}`);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1500);
    } catch (e) {
      console.warn('[curratio] copy failed', e);
    }
  }

  function selectAll(e: FocusEvent) {
    (e.target as HTMLInputElement).select();
  }
</script>

<div class="converter">
  <div class="box">
    {#each [ECalcSide.From, ECalcSide.To] as side (side)}
      {#if side === ECalcSide.To}<div class="line"></div>{/if}
      <div class="row">
        <button class="cur" on:click={() => pick(side)} title="Change currency">
          <span>{calc[side]}</span>
          <span class="name">{currencyName(calc[side])}</span>
          <Icon name="chevronDown" size={12} stroke={2.5} class="muted" />
        </button>
        <input
          value={side === ECalcSide.From ? fromVal : toVal}
          on:input={(e) => onInput(side, e)}
          on:focus={selectAll}
          inputmode="decimal"
          placeholder="0"
          aria-label={side === ECalcSide.From ? 'Amount to convert' : 'Converted amount'}
          {disabled}
          class="num"
        />
      </div>
    {/each}
    <button class="swap" on:click={swap} title="Swap currencies" aria-label="Swap currencies">
      <Icon name="swapVertical" size={12} stroke={2.25} />
    </button>
  </div>
  <div class="foot">
    <span class="spacer num">{unit}</span>
    {#if canTrack}
      <button class="link-btn" on:click={track}>+ track</button>
    {/if}
    <button class="link-btn" on:click={copy} {disabled}>{copied ? 'Copied' : 'Copy'}</button>
  </div>
</div>

<style>
  .converter {
    padding: var(--space-4);
    border-bottom: 1px solid var(--border);
  }
  .box {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: 46px;
    padding: 0 var(--space-6) 0 var(--space-2);
  }
  .line {
    height: 1px;
    margin: 0 var(--space-6);
    background: var(--border);
  }
  .cur {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    height: 30px;
    padding: 0 var(--space-3) 0 var(--space-4);
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text);
    font-size: var(--fs-base);
    font-weight: 600;
  }
  .cur:hover {
    background: var(--bg);
  }
  .name {
    font-size: var(--fs-sm);
    font-weight: 400;
    color: var(--text-muted);
    max-width: 92px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--text);
    caret-color: var(--accent);
    font-size: var(--fs-amount);
    font-weight: 600;
    text-align: right;
  }
  input:disabled {
    color: var(--text-muted);
  }
  .swap {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text-muted);
    border-radius: var(--radius-pill);
  }
  .swap:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .foot {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    padding: 0 var(--space-2);
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
</style>
