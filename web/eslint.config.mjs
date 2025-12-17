import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Disable strict React hooks rules for AI Elements library components
  // These are from an external library and should be fixed upstream
  {
    files: ["components/ai-elements/**/*.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
