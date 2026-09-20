import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // This client workspace deliberately fetches authenticated resources in
      // effects; loading/error state is local and never mirrored from props.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "coverage/**", "playwright-report/**", "test-results/**"]),
]);
