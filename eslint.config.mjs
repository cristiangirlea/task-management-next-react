import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        rules: {
            // New in React Hooks 7 (Next 16). Our flagged effects load data on
            // mount or sync from browser storage and the URL, patterns that
            // predate the rule. Kept visible as warnings rather than rewritten
            // in the same change as the upgrade.
            'react-hooks/set-state-in-effect': 'warn',
        },
        settings: {
            'import/resolver': {
                typescript: {
                    project: './tsconfig.json',
                },
            },
        },
    },
    // api/ is the Laravel checkout the browser tests use in CI.
    globalIgnores(['.next/**', 'out/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**', 'api/**']),
]);

export default eslintConfig;
