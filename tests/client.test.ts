import { describe, expect, it } from "vitest";
import { buildSearchBody, normalizeBaseUrl } from "../src/client";

describe("normalizeBaseUrl", () => {
	it("trims whitespace and trailing slashes", () => {
		expect(normalizeBaseUrl("  http://localhost:8765/  ")).toBe(
			"http://localhost:8765"
		);
	});

	it("leaves a clean URL untouched", () => {
		expect(normalizeBaseUrl("http://localhost:8765")).toBe(
			"http://localhost:8765"
		);
	});
});

describe("buildSearchBody", () => {
	it("sets top_n and a widened candidate_k", () => {
		expect(buildSearchBody("prd audit", 20)).toEqual({
			query: "prd audit",
			top_n: 20,
			candidate_k: 100,
		});
	});

	it("floors candidate_k at 50 for small top_n", () => {
		expect(buildSearchBody("x", 5).candidate_k).toBe(50);
	});
});
