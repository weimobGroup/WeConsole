module.exports = {
    root: true,
    extends: ['standard', 'alloy', 'alloy/typescript'],
    parserOptions: {
        project: './tsconfig-eslint.json'
    },
    globals: {
        global: 'readonly',
        wx: 'writable',
        getApp: 'writable',
        getCurrentPages: 'writable',
        Page: 'writable',
        App: 'writable',
        Component: 'writable'
    },
    rules: {
        indent: ['error', 4],
        quotes: ['error', 'single'],
        semi: 0,
        radix: ['error', 'as-needed'],
        'func-name-matching': [0, 'always'],
        'no-param-reassign': [0],
        'max-params': ['error', 6],
        'space-before-function-paren': ['warn', 'never'],
        'max-nested-callbacks': ['error', 5]
    },
    overrides: [
        {
            extends: ['plugin:@typescript-eslint/recommended-requiring-type-checking'],
            files: ['./**/*.{ts,tsx,vue}']
        },
        {
            extends: ['plugin:@typescript-eslint/disable-type-checked'],
            files: ['./**/*.js']
        },
        {
            files: ['**/*.{ts,tsx,vue}'],
            rules: {
                'no-unused-vars': 'off',
                '@typescript-eslint/no-unused-vars': ['error'],
                '@typescript-eslint/no-unsafe-assignment': 'off',
                '@typescript-eslint/unbound-method': 'off',
                '@typescript-eslint/no-unsafe-return': 'off',
                '@typescript-eslint/no-unsafe-argument': 'off',
                '@typescript-eslint/no-unsafe-call': 'off',
                '@typescript-eslint/no-unsafe-member-access': 'off',
                '@typescript-eslint/no-floating-promises': 'off',
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/explicit-member-accessibility': 'off'
            }
        },
        {
            files: ['**/*.ts'],
            rules: {
                'no-unused-vars': 'off',
                '@typescript-eslint/no-unused-vars': ['error'],
                '@typescript-eslint/explicit-member-accessibility': 'off'
            }
        },
        {
            files: ['**/*.js'],
            rules: {
                '@typescript-eslint/no-require-imports': 'off'
            }
        }
    ]
};
