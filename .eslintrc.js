module.exports = {
  root: true,
  parserOptions: {
    project: "./tsconfig.test.json"
  },
  extends: [
    "airbnb-typescript/base",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:prettier/recommended",
    "plugin:jest/recommended",
    "prettier"
  ],
  plugins: ["prettier", "jest"],
  rules: {
    "import/extensions": ["off"],
    // Typescript handles this for us instead
    "import/no-unresolved": ["off"],
    "no-else-return": ["off"],
    // Obviously, this has to be off cause Suspense is all about throwing literals
    "@typescript-eslint/no-throw-literal": ["off"]
  }
};
