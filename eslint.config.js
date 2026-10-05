import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import refresh from 'eslint-plugin-react-refresh'
export default tseslint.config(
  { ignores: ['**/dist', '**/node_modules', '.tools', '.npm-cache', 'apps/api/src/generated', 'apps/api/uploads', 'test-results', '.demo'] },
  { files: ['**/*.{ts,tsx}'], extends: [js.configs.recommended, ...tseslint.configs.recommended], languageOptions: { ecmaVersion: 2022, globals: globals.browser }, plugins: { 'react-hooks': hooks, 'react-refresh': refresh }, rules: { ...hooks.configs.recommended.rules, 'react-refresh/only-export-components': ['warn', { allowConstantExport: true }] } },
  { files: ['apps/api/**/*.ts', '**/vite.config.ts'], languageOptions: { globals: globals.node } },
  // Library code, not an app entry: React Fast Refresh boundaries don't apply.
  { files: ['packages/**/*.{ts,tsx}'], rules: { 'react-refresh/only-export-components': 'off' } },
)
