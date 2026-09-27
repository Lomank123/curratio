export type ChangelogEntry = {
  version: string;
  items: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.0',
    items: [
      'Track currency pairs with daily change',
      'Bookmark pairs to pin them on top',
      'Built-in two-way converter with currency search',
      'Primary currency with suggested pairs',
      'Convert selected prices on any page',
      'Optionally convert all prices on a page',
      'Refresh every 1–3 minutes, dark and light themes',
    ],
  },
];
