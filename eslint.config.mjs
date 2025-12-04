import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import checkFile from "eslint-plugin-check-file";
import importPlugin from "eslint-plugin-import";
import globals from "globals";
import { parser as tsParser, configs as tsConfigs } from "typescript-eslint";

const typeScriptExtensions = [".ts", ".cts", ".mts"];
const allExtensions = [...typeScriptExtensions, ".js", ".jsx", ".mjs", ".cjs"];

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  js.configs.recommended,
  ...tsConfigs.recommended,
  importPlugin.flatConfigs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      "check-file": checkFile,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },

    settings: {
      "import/extensions": allExtensions,
      "import/external-module-folders": ["node_modules", "node_modules/@types"],
      "import/parsers": {
        "@typescript-eslint/parser": typeScriptExtensions,
      },
      "import/resolver": {
        node: {
          extensions: allExtensions,
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },

    rules: {
      "no-redeclare": "off",
      "no-unused-vars": "off",
      "import/named": "off",
      "import/no-unresolved": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/!(_)*.{ts,tsx}": "KEBAB_CASE",
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "**/!(__*__|_*)": "KEBAB_CASE",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
          fixStyle: "separate-type-imports",
        },
      ],
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],

          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
    files: ["**/*.js", "**/*.ts"],
  },
  {
    ignores: [
      "**/node_modules/",
      "**/coverage/",
      "**/*.config.{mj,cj,j,t,mt,ct}s",
      "**/.dist/",
    ],
  },
];
