module.exports = [
  {
    ignores: ["node_modules/**", ".cache/**", "dist/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    rules: {
      "no-console": "off",
      "prefer-const": "warn",
    },
  },
];
