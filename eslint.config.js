import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'design/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions, ...globals.node },
    },
  },
  {
    // TypeScript already checks undefined identifiers (incl. Svelte generics).
    files: ['**/*.ts', '**/*.svelte'],
    rules: { 'no-undef': 'off' },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tseslint.parser },
    },
  },
);
