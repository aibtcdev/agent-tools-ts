import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "stacks-dao/index": "src/stacks-dao/index.ts",
  },
  format: ["cjs", "esm"],
  dts: {
    entry: {
      index: "src/index.ts",
      "stacks-dao/index": "src/stacks-dao/index.ts",
    },
    compilerOptions: {
      moduleResolution: "node",
      composite: false,
      skipLibCheck: true,
    },
  },
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".js",
    };
  },
  outDir: "dist",
  platform: "node",
  external: [
    "@stacks/blockchain-api-client",
    "@stacks/network",
    "@stacks/transactions",
  ],
});
