const browserGlobals = {
  CustomEvent: "readonly",
  document: "readonly",
  URL: "readonly",
  window: "readonly"
};

const nodeGlobals = {
  Buffer: "readonly",
  URL: "readonly",
  fetch: "readonly",
  process: "readonly"
};

export default [
  {
    ignores: [
      "**/._*",
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "test-results/**",
      "playwright-report/**"
    ]
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    },
    rules: {
      "no-constant-condition": "error",
      "no-debugger": "error",
      "no-undef": "error",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  },
  {
    files: ["js/**/*.js", "tests/e2e/**/*.js", "tests/test-runner.js"],
    languageOptions: {
      globals: browserGlobals
    }
  },
  {
    files: [
      "playwright.config.js",
      "scripts/**/*.mjs",
      "tests/**/*.{js,mjs}"
    ],
    languageOptions: {
      globals: nodeGlobals
    }
  }
];
