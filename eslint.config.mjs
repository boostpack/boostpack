import nx from '@nx/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import sonarjsEslintPlugin from 'eslint-plugin-sonarjs';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/build'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:backend',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:backend'],
            },
            {
              sourceTag: 'scope:nestjs',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:nestjs'],
            },
            {
              sourceTag: 'scope:frontend',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:frontend'],
            },
          ],
        },
      ],
    },
  },
  sonarjsEslintPlugin.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: 'tsconfig.*?.json',
      },
    },
    rules: {
      ...typescriptEslintPlugin.configs['recommended-type-checked'].rules,
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      ...typescriptEslintPlugin.configs['recommended'].rules,
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    rules: {
      'lines-between-class-members': [
        'error',
        {
          enforce: [
            { blankLine: 'always', prev: 'method', next: 'field' },
            { blankLine: 'always', prev: 'field', next: 'method' },
            { blankLine: 'always', prev: 'method', next: 'method' },
          ],
        },
      ],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: ['multiline-const', 'multiline-let', 'multiline-expression'], next: '*' },
      ],

      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            object: true,
          },
        },
      ],
      'curly': ['error', 'all'],
      'no-useless-escape': ['error'],
      'no-use-before-define': ['error'],
      'no-console': ['error'],
      'no-var': ['error'],
      'eqeqeq': ['error'],
      'object-shorthand': ['error', 'always'],
      'prefer-destructuring': [
        'error',
        {
          array: true,
          object: true,
        },
      ],
      'spaced-comment': ['error', 'always'],
      'no-template-curly-in-string': ['error'],

      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['StrictPascalCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'objectLiteralProperty',
          format: null,
        },
      ],

      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration[id.name=/Enum$/]',
          message: "Enum names should not end with 'Enum'.",
        },
      ],

      'no-await-in-loop': 'error',
      'no-param-reassign': ['error', { ignorePropertyModificationsFor: ['ctx', 'req', 'res', 'acm'], props: true }],
      '@typescript-eslint/no-non-null-assertion': 'error',

      'sonarjs/fixme-tag': 'warn',
      'sonarjs/todo-tag': 'warn',

      'sonarjs/sonar-no-fallthrough': 'off',
      'sonarjs/no-commented-code': 'off',
      'sonarjs/use-type-alias': 'off',
      'sonarjs/deprecation': 'warn',
    },
  },
];
