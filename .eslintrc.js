module.exports = {
    parser: 'babel-eslint',
    extends: ['airbnb-base', 'plugin:import/errors', 'prettier'],
    env: {
        jest: true,
    },
    plugins: ['import'],
    rules: {
        indent: ['error', 4, { SwitchCase: 1 }],
        'max-len': ['error', 120],
        'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
        'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
        'no-mixed-operators': 'off',
        'no-await-in-loop': 'off',
        'func-names': ['error', 'never'],
        'import/prefer-default-export': 'off',
        'import/no-named-as-default': 'off',
        'import/no-extraneous-dependencies': [
            'error',
            { devDependencies: ['**/*.test.js', '**/*.spec.js', '**/test/*.js', '**/__tests__/*.js'] },
        ],
        "no-underscore-dangle": ["error", { "allowAfterThis": true }],
        'no-param-reassign': 'off',
        'class-methods-use-this': 'off',
        'no-shadow': 'off',
        'consistent-return': 'off',
        'spaced-comment': ['error', 'always'],
        'react/prop-types': 'off',
    },
};
