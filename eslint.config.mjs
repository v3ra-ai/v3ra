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
    rules: {
      // Allow console logs for beta deployment
      "no-console": "off",
      
      // Relax some rules for beta deployment
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/next-script-for-ga": "warn",
      "react-hooks/rules-of-hooks": "error", // Keep this as error since it's critical
      "prefer-const": "warn",
      
      // Allow some flexibility for beta
      "react/display-name": "off",
      "@typescript-eslint/no-empty-function": "off",
    },
  },
];

export default eslintConfig;