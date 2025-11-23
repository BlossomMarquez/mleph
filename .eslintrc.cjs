module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  rules: {
    // allow console for now (browser dev use)
    "no-console": "off",
    // prefer const where possible
    "prefer-const": "warn",
  },
};
