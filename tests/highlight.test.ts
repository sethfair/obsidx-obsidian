import { describe, expect, it } from "vitest";
import { highlightSegments, tokenize } from "../src/highlight";

describe("tokenize", () => {
	it("lowercases and drops short tokens and duplicates", () => {
		expect(tokenize("PRD Audit a PRD")).toEqual(["prd", "audit"]);
	});

	it("splits on punctuation but keeps hyphens/underscores", () => {
		expect(tokenize("high-priority, prd_audit")).toEqual([
			"high-priority",
			"prd_audit",
		]);
	});

	it("returns empty for whitespace-only input", () => {
		expect(tokenize("   ")).toEqual([]);
	});
});

describe("highlightSegments", () => {
	it("returns a single non-match segment when there are no tokens", () => {
		expect(highlightSegments("hello world", [])).toEqual([
			{ text: "hello world", match: false },
		]);
	});

	it("marks matched tokens case-insensitively", () => {
		const segs = highlightSegments("The PRD Tracker", ["prd"]);
		expect(segs).toEqual([
			{ text: "The ", match: false },
			{ text: "PRD", match: true },
			{ text: " Tracker", match: false },
		]);
	});

	it("prefers the longest token when tokens overlap", () => {
		const segs = highlightSegments("prd-audit", ["prd", "prd-audit"]);
		expect(segs).toEqual([{ text: "prd-audit", match: true }]);
	});

	it("handles multiple matches", () => {
		const segs = highlightSegments("prd and prd", ["prd"]);
		expect(segs.filter((s) => s.match).length).toBe(2);
	});

	it("preserves the original text when reassembled", () => {
		const text = "2026-06-02 High Priority PRD Audit";
		const segs = highlightSegments(text, ["prd", "audit"]);
		expect(segs.map((s) => s.text).join("")).toBe(text);
	});
});
