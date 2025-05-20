import prettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      ...prettier.rules,
      "prettier/prettier": "error",
      "react/no-unescaped-entities": [
        "error",
        { forbid: [">", "}", "`", '"', "'", "{", "<"] },
      ],

      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "never",
        },
      ],

      "comma-spacing": ["error", { before: false, after: true }],
    },
  },
];

export default eslintConfig;
