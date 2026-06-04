import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
	resolve: {
		alias: {
			// Stub Obsidian's runtime API so pure-logic modules stay testable.
			obsidian: resolve(__dirname, "tests/stubs/obsidian.ts"),
		},
	},
	test: {
		include: ["tests/**/*.test.ts"],
	},
});
