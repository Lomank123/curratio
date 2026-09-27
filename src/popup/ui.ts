import { writable } from 'svelte/store';
import type { EModal, EPickerTarget } from '../lib/enums';

export const modal = writable<EModal | null>(null);

/** `code: null` = the "Use primary" option (page-convert target only). */
export type PickResult = { code: string | null };

export type PickerRequest = {
  target: EPickerTarget;
  selected: string | null;
  allowPrimary: boolean;
  resolve: (result: PickResult | null) => void;
};

export const picker = writable<PickerRequest | null>(null);

/** Open the currency picker; resolves with the choice, or null when dismissed. */
export function pickCurrency(
  target: EPickerTarget,
  selected: string | null,
  allowPrimary = false,
): Promise<PickResult | null> {
  return new Promise((resolve) => picker.set({ target, selected, allowPrimary, resolve }));
}
