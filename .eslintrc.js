module.exports = {
    parser: '@typescript-eslint/parser',
    extends: ['alloy', 'alloy/typescript', 'standard'],
    plugins: ['@typescript-eslint', 'standard'],
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
