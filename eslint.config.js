// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    rules: {
      "no-constant-condition": 0,
      "no-control-regex": 0,
      "@typescript-eslint/no-explicit-any": 0,
    },
  }
);