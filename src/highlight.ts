/**
 * Best-effort query-term highlighting.
 *
 * obsidx is a *semantic* engine, so the server does not return literal match
 * offsets the way a keyword engine (e.g. Omnisearch/minisearch) does. To keep
 * the same visual feel — underlined matched terms — we tokenize the query and
 * highlight those tokens wherever they happen to appear in the title, folder
 * path, or excerpt.
 */

export interface Segment {
	text: string;
	/** true when this segment matched a query token and should be highlighted */
	match: boolean;
}

/** Split a raw query into lowercase word tokens (>= 2 chars). */
export function tokenize(query: string): string[] {
	return Array.from(
		new Set(
			query
				.toLowerCase()
				.split(/[^\p{L}\p{N}_-]+/u)
				.filter((t) => t.length >= 2)
		)
	);
}

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split `text` into alternating non-match / match segments for the given
 * tokens. Pure function — the DOM rendering lives in the modal so this stays
 * unit-testable without an Obsidian environment.
 */
export function highlightSegments(text: string, tokens: string[]): Segment[] {
	if (!tokens.length || !text) {
		return [{ text, match: false }];
	}

	// Longest tokens first so "prd-audit" wins over "prd" when both are present.
	const pattern = tokens
		.slice()
		.sort((a, b) => b.length - a.length)
		.map(escapeRegex)
		.join("|");
	const re = new RegExp(`(${pattern})`, "giu");

	const segments: Segment[] = [];
	let last = 0;
	for (const m of text.matchAll(re)) {
		const idx = m.index ?? 0;
		if (idx > last) {
			segments.push({ text: text.slice(last, idx), match: false });
		}
		segments.push({ text: m[0], match: true });
		last = idx + m[0].length;
	}
	if (last < text.length) {
		segments.push({ text: text.slice(last), match: false });
	}
	return segments;
}
