import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

/**
 * Lint setup notes:
 * - typescript-eslint is unusable here because the project compiles with
 *   TypeScript 7 (native), which typescript-eslint@8 does not support.
 *   @babel/eslint-parser parses TS/TSX syntax without loading the TS compiler
 *   API, so linting stays independent of the TS version. Type-level checking
 *   remains the job of `tsc --noEmit` (see the `lint` npm script).
 * - `no-undef` and `no-unused-vars` are disabled for TS files: a syntax-level
 *   parser cannot see type-only usage (type imports, `this.client` parameter
 *   properties), so both rules only produce false positives here. Undefined
 *   identifiers and unused locals are owned by `tsc --noEmit` with
 *   noUnusedLocals/noUnusedParameters (see tsconfig.json).
 */
const tsParserOptions = {
  requireConfigFile: false,
  babelOptions: {
    parserOpts: {
      plugins: ["typescript"],
    },
  },
};

const tsxParserOptions = {
  requireConfigFile: false,
  babelOptions: {
    parserOpts: {
      plugins: ["typescript", "jsx"],
    },
  },
};

export default [
  {
    ignores: [".next/**", "node_modules/**", "public/sw.js", "next-env.d.ts", "out/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: babelParser,
      parserOptions: tsParserOptions,
      globals: { ...globals.browser },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["src/**/*.tsx"],
    languageOptions: {
      parser: babelParser,
      parserOptions: tsxParserOptions,
      globals: { ...globals.browser },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      ...reactHooks.configs.flat?.recommended?.rules ?? reactHooks.configs.recommended.rules,
      // These rules produce false positives on legitimate React patterns:
      // - ref syncing during render (lockedIndexRef.current = lockedIndex)
      // - setState in data-loading effects
      // - cleanup ref nulling in effect teardown
      // - keeping refs current for event handler closures
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: tsParserOptions,
      globals: {
        ...globals.node,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        vi: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.mjs", "*.config.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
