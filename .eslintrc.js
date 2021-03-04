module.exports = {
  root: true,
  parserOptions: {
    project: "./tsconfig.json"
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
    "no-else-return": ["off"]
  }
};
