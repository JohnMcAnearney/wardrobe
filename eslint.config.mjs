import tseslint from "typescript-eslint";
import obsidian from "eslint-plugin-obsidianmd";
const pluginRules = Object.assign({}, ...[...obsidian.configs.recommended].map(config => config.rules ?? {}));
export default tseslint.config({
 files: ["src/**/*.ts"],
 languageOptions: { parser: tseslint.parser, parserOptions: { project: "./tsconfig.json", tsconfigRootDir: import.meta.dirname } },
 plugins: { obsidianmd: obsidian, "@typescript-eslint": tseslint.plugin },
 rules: {
  ...Object.fromEntries(Object.entries(pluginRules).filter(([key]) => key.startsWith("obsidianmd/"))),
  "no-useless-escape": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-call": "error",
  "@typescript-eslint/no-unsafe-member-access": "error",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": "error",
 }
});
