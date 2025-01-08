import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "prefer-const": "warn",
      "@typescript-eslint/no-unused-vars": ["warn"],
      "@typescript-eslint/no-explicit-any": ["warn"],
      "@typescript-eslint/no-empty-object-type": ["warn"],
      "react/no-unescaped-entities": "warn", // Change to "warn" if you prefer a warning
      "@typescript-eslint/no-unused-expressions": "warn", // Change to "warn" if you prefer a warning
    },
  },
]

export default eslintConfig
