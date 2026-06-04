import { describe, expect, it } from "vitest";
import { cleanExcerpt, splitPath, toVaultRelative } from "../src/paths";

describe("toVaultRelative", () => {
	const base = "/Users/seth/SecondBrain";

	it("strips the vault base path", () => {
		expect(
			toVaultRelative(`${base}/Writerflow/Development/PRD-Tracker.md`, base)
		).toBe("Writerflow/Development/PRD-Tracker.md");
	});

	it("handles a file at the vault root", () => {
		expect(toVaultRelative(`${base}/TODO.md`, base)).toBe("TODO.md");
	});

	it("returns the input (normalized) when base does not match", () => {
		expect(toVaultRelative("/elsewhere/note.md", base)).toBe(
			"elsewhere/note.md"
		);
	});

	it("returns the input when base is empty (non-FileSystemAdapter)", () => {
		expect(toVaultRelative("Writerflow/x.md", "")).toBe("Writerflow/x.md");
	});

	it("does not strip a sibling dir that merely shares a prefix", () => {
		expect(toVaultRelative("/Users/seth/SecondBrain2/x.md", base)).toBe(
			"Users/seth/SecondBrain2/x.md"
		);
	});
});

describe("splitPath", () => {
	it("splits dir, base, and ext", () => {
		expect(splitPath("Writerflow/Development/PRD-Tracker.md")).toEqual({
			dir: "Writerflow/Development",
			name: "PRD-Tracker.md",
			base: "PRD-Tracker",
			ext: "md",
		});
	});

	it("handles a root-level file", () => {
		expect(splitPath("TODO.md")).toEqual({
			dir: "",
			name: "TODO.md",
			base: "TODO",
			ext: "md",
		});
	});

	it("handles dotfiles without treating the leading dot as an ext", () => {
		const s = splitPath(".gitignore");
		expect(s.base).toBe(".gitignore");
		expect(s.ext).toBe("");
	});
});

describe("cleanExcerpt", () => {
	it("collapses blank lines and trims", () => {
		expect(cleanExcerpt("---\n\n## Purpose\n\nHello")).toBe(
			"--- ## Purpose Hello"
		);
	});
});
