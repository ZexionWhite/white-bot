module.exports = {
  env: {
    node: true,
    es2022: true
  },
  extends: [
    "eslint:recommended",
    "plugin:node/recommended",
    "prettier"
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module"
  },
  plugins: ["node"],
  rules: {
    "node/no-unsupported-features/es-syntax": ["error", {
      ignores: ["modules"]
    }],
    "no-unused-vars": ["warn", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }]
  }
};
