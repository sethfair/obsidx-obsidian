/**
 * Path helpers.
 *
 * The obsidx indexer stores ABSOLUTE filesystem paths (e.g.
 * `/Users/seth/SecondBrain/Writerflow/Development/PRD-Tracker.md`), so before
 * we can open a result in Obsidian — or render a clean folder line — we have to
 * convert it back to a vault-relative path using the vault's base path.
 */

export interface SplitPath {
	/** vault-relative directory, "" for vault root */
	dir: string;
	/** file name including extension */
	name: string;
	/** file name without extension */
	base: string;
	/** extension without the dot, "" if none */
	ext: string;
}

/** Normalize separators and trim a leading slash. */
function normalizeSep(p: string): string {
	return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

/**
 * Convert an absolute index path to a vault-relative path. If `basePath` is
 * empty or `absPath` is already relative (doesn't start with basePath), the
 * input is returned with separators normalized.
 */
export function toVaultRelative(absPath: string, basePath: string): string {
	const a = absPath.replace(/\\/g, "/");
	const b = basePath.replace(/\\/g, "/").replace(/\/+$/, "");
	if (b && (a === b || a.startsWith(b + "/"))) {
		return normalizeSep(a.slice(b.length));
	}
	return normalizeSep(a);
}

/** Split a vault-relative path into dir / name / base / ext. */
export function splitPath(relPath: string): SplitPath {
	const p = normalizeSep(relPath);
	const slash = p.lastIndexOf("/");
	const dir = slash >= 0 ? p.slice(0, slash) : "";
	const name = slash >= 0 ? p.slice(slash + 1) : p;
	const dot = name.lastIndexOf(".");
	const base = dot > 0 ? name.slice(0, dot) : name;
	const ext = dot > 0 ? name.slice(dot + 1) : "";
	return { dir, name, base, ext };
}

/**
 * Trim YAML frontmatter delimiters / leading noise out of an excerpt so the
 * result body reads like content, not `---`. Best-effort, display-only.
 */
export function cleanExcerpt(content: string): string {
	return content
		.replace(/\r/g, "")
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.length > 0)
		.join(" ")
		.slice(0, 400);
}
