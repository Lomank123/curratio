export type ChangelogEntry = {
  version: string;
  items: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.0',
    items: [
      'Track currency pairs with daily change, as percent or actual value',
      'Feature pairs to pin them on top, drag to reorder',
      'Built-in two-way converter with currency search',
      'Primary currency with suggested pairs',
      'Convert selected prices on any page',
      'Optionally convert all prices on a page',
      'Background refresh from every 30 seconds to hourly, dark and light themes',
    ],
  },
];
